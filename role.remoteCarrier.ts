import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, moveRoom, pickUpAll } from "./util.creep";
import { findMyStructures, getSitesInRoom, isHighway, readonly } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isRemoteCarrier(creep)) {
    return console.log(`${creep.name} is not RemoteCarrier`);
  }
  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) => {
    return customMove(creep, target, {
      plainCost: 2,
      swampCost: 3,
      ...opt,
    });
  };

  const memory = readonly(creep.memory);

  const preMode = memory.mode;
  //#region モードチェック
  if (creep.store.energy < CARRY_CAPACITY) {
    // なくなったら収集モード
    creep.memory.mode = "gathering";
  } else if (creep.room.name !== memory.baseRoom && creep.getActiveBodyparts(WORK) > 0 && getSitesInRoom(creep.room).length > 0) {
    // エネルギーがあって現場ある時は建築モード
    creep.memory.mode = "👷";
  } else {
    // それ以外は運搬モード
    creep.memory.mode = "delivering";
    // キャリーサイズ記録
    (creep.room.memory.carrySize = creep.room.memory.carrySize || {}).remoteCarrier =
      ((creep.room.memory.carrySize?.remoteCarrier || 100) * 100 + creep.store.energy) / 101;
  }
  if (memory.mode !== preMode) {
    creep.memory.storeId = undefined;
    creep.memory.transferId = undefined;
    creep.say(memory.mode);
  }

  //#endregion

  if (memory.mode === "delivering") {
    const baseRoom = Game.rooms[memory.baseRoom];

    if (baseRoom) {
      //#region 輸送先設定処理 ##########################################################################

      // 取れないか容量がない時は輸送先を初期化する
      if (memory.transferId && (Game.getObjectById(memory.transferId)?.store.getFreeCapacity(RESOURCE_ENERGY) || 0) === 0) {
        creep.memory.transferId = undefined;
      }
      if (!memory.transferId) {
        const { container, link } = findMyStructures(baseRoom);
        const targets = _.compact([
          ...container.filter((c) => {
            // ミネラル用のコンテナを除外しておく
            return baseRoom.find(FIND_MINERALS).some((m) => !c.pos.inRangeTo(m, 3));
          }),
          ...link,
          creep.room.storage,
          creep.room.terminal,
        ]).filter((s) => s.structureType === STRUCTURE_LINK || s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);

        // 検索する
        const searched = PathFinder.search(
          creep.pos,
          targets.map((t) => t.pos),
          { plainCost: 2, swampCost: 10 },
        );
        if (!searched.incomplete && searched.path.length > 0) {
          creep.memory.transferId = _(searched.path).last().findClosestByRange(targets)?.id;
        }
      }
      //#endregion ##########################################################################

      //#region 輸送処理 ##########################################################################
      const transferTarget = memory.transferId && Game.getObjectById(memory.transferId);
      if (transferTarget) {
        _(creep.transfer(transferTarget, RESOURCE_ENERGY))
          .tap((result) => {
            switch (result) {
              case OK:
                break;
              case ERR_NOT_IN_RANGE:
                moveMeTo(transferTarget);
                break;
              default:
                creep.say(RETURN_CODE_DECODER[result.toString()].replace("ERR_", ""));
                console.log(creep.name, creep.saying);
                break;
            }
          })
          .run();
      }

      //#endregion ##########################################################################
    }
  } else if (memory.mode === "👷") {
    //#region 建設 ##########################################################################
    if (creep.getActiveBodyparts(WORK) === 0) {
      return (creep.memory.mode = "delivering");
    }
    const sites = getSitesInRoom(creep.room);
    // 終わってれば初期化
    if (memory.siteId && !Game.getObjectById(memory.siteId)) {
      creep.memory.siteId = undefined;
    }

    // 現場を取得する
    if (!memory.siteId) {
      creep.memory.siteId = creep.pos.findClosestByPath(sites)?.id;
    }

    const site = memory.siteId && Game.getObjectById(memory.siteId);
    if (site) {
      _(creep.build(site))
        .tap((result) => {
          switch (result) {
            case OK:
              break;
            case ERR_NOT_IN_RANGE:
              moveMeTo(site);
              break;
            default:
              creep.say(RETURN_CODE_DECODER[result.toString()].replace("ERR_", ""));
              console.log(creep.name, creep.saying);
              break;
          }
        })
        .run();
    }
    //#endregion
  } else {
    const targetRoom = Game.rooms[memory.targetRoomName] as Room | undefined;
    if (!targetRoom) {
      // 部屋が見えない場合
      // とにかく向かう
      return moveRoom(creep, creep.pos.roomName, memory.targetRoomName);
    }

    //#region 取得先設定処理 ##########################################################################
    if (!creep.memory.storeId || (Game.getObjectById(creep.memory.storeId)?.store.energy || 0) === 0) {
      creep.memory.storeId = undefined;
    }
    if (!memory.storeId) {
      const containers = targetRoom.find(FIND_STRUCTURES, {
        filter: (s): s is StructureContainer => s.structureType === STRUCTURE_CONTAINER,
      });
      const searched = PathFinder.search(
        creep.pos,
        _(containers)
          .thru((all) => {
            const hasE = all.filter((c) => c.store.energy);
            if (hasE.length) {
              return hasE;
            } else {
              return all;
            }
          })
          .map((t: StructureContainer) => t.pos)
          .value(),
        { plainCost: 2, swampCost: 3 },
      );

      if (!searched.incomplete && searched.path.length > 0) {
        // RoomPositionしか取れないので同じ場所のやつを探す
        creep.memory.storeId = _(searched.path).last().findClosestByRange(containers)?.id;
      } else {
        // 部屋が見えない場合
        // とにかく向かう
        return moveRoom(creep, creep.pos.roomName, memory.targetRoomName);
      }
    }
    //#endregion #########################################################################
    //#region 取り出し処理 #########################################################################
    const store = memory.storeId && Game.getObjectById(memory.storeId);
    if (store) {
      _(creep.withdraw(store, RESOURCE_ENERGY))
        .tap((result) => {
          switch (result) {
            case OK:
              break;
            case ERR_NOT_IN_RANGE:
              moveMeTo(store);
              break;
            default:
              creep.say(RETURN_CODE_DECODER[result.toString()].replace("ERR_", ""));
              console.log(creep.name, creep.saying);
              break;
          }
        })
        .run();
    }
    //#endregion ##########################################################################
  }
  //#region 道を敷く
  if (
    creep.memory.mode === "delivering" &&
    creep.pos.roomName !== creep.memory.baseRoom &&
    getSitesInRoom(creep.room).length === 0 &&
    !isHighway(creep.room) &&
    !creep.pos.lookFor(LOOK_STRUCTURES).find((s) => s.structureType === STRUCTURE_ROAD)
  ) {
    // 現在地に道が無ければ作らせる
    creep.pos.createConstructionSite(STRUCTURE_ROAD);
  }

  //#endregion

  //#region その他の処理 ##########################################################################

  // 落っこちてるものをひろう
  pickUpAll(creep);
  //#endregion ##########################################################################
};
export default behavior;
function isRemoteCarrier(creep: Creep): creep is RemoteCarrier {
  return creep.memory.role === "remoteCarrier";
}
