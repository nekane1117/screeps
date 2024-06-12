import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, moveRoom, pickUpAll } from "./util.creep";
import { findMyStructures, readonly } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isRemoteCarrier(creep)) {
    return console.log(`${creep.name} is not RemoteCarrier`);
  }
  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) => {
    return customMove(creep, target, {
      ...opt,
    });
  };

  const memory = readonly(creep.memory);

  //#region モードチェック
  if (memory.mode === "🚛" && creep.store.energy < CARRY_CAPACITY) {
    creep.memory.mode = "🛒";
  } else if (memory.mode === "🛒" && creep.store.energy >= CARRY_CAPACITY) {
    creep.memory.mode = "🚛";
    (creep.room.memory.carrySize = creep.room.memory.carrySize || {}).remoteCarrier =
      ((creep.room.memory.carrySize?.remoteCarrier || 100) * 100 + creep.store.energy) / 101;
  }

  //#endregion

  if (memory.mode === "🚛") {
    const baseRoom = Game.rooms[memory.baseRoom];

    if (baseRoom) {
      //#region 輸送先設定処理 ##########################################################################

      // 取れないか容量がない時は輸送先を初期化する
      if (memory.transferId && (Game.getObjectById(memory.transferId)?.store.getFreeCapacity(RESOURCE_ENERGY) || 0) === 0) {
        creep.memory.transferId = undefined;
      }
      if (!memory.transferId) {
        const { container, link, storage, terminal } = findMyStructures(baseRoom);
        const targets = [
          ...container.filter((c) => {
            // ミネラル用のコンテナを除外しておく
            return baseRoom.find(FIND_MINERALS).some((m) => c.pos.inRangeTo(m, 3));
          }),
          ...link,
          ...storage,
          ...terminal,
        ];

        // 検索する
        const searched = PathFinder.search(
          creep.pos,
          targets.map((t) => t.pos),
          { plainCost: 2, swampCost: 10 },
        );
        if (!searched.incomplete && searched.path.length > 0) {
          // RoomPositionしか取れないので同じ場所のやつを探す
          const target = targets.find((t) => {
            const goal = _(searched.path).last();
            // 完全に同じやつを探す
            return t.pos.x === goal?.x && t.pos.y === goal.y && goal.roomName === t.pos.roomName;
          });
          creep.memory.transferId = target?.id;
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
  } else {
    const targetRoom = Game.rooms[memory.targetRoomName] as Room | undefined;
    if (!targetRoom) {
      // 部屋が見えない場合
      // とにかく向かう
      return moveRoom(creep, creep.pos.roomName, memory.targetRoomName);
    }

    //#region 取得先設定処理 ##########################################################################
    if (creep.memory.storeId && (Game.getObjectById(creep.memory.storeId)?.store.energy || 0) === 0) {
      creep.memory.storeId = undefined;
    }

    if (!memory.storeId) {
      const containers = targetRoom.find(FIND_STRUCTURES, { filter: (s): s is StructureContainer => s.structureType === STRUCTURE_CONTAINER });
      const searched = PathFinder.search(
        creep.pos,
        containers.map((t) => t.pos),
        { plainCost: 2, swampCost: 10 },
      );
      if (!searched.incomplete && searched.path.length > 0) {
        // RoomPositionしか取れないので同じ場所のやつを探す
        const target = containers.find((c) => {
          const goal = _(searched.path).last();
          // 完全に同じやつを探す
          return c.pos.x === goal?.x && c.pos.y === goal.y && goal.roomName === c.pos.roomName;
        });
        creep.memory.storeId = target?.id;
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

    //#region その他の処理 ##########################################################################

    // 落っこちてるものをひろう
    pickUpAll(creep);
    //#endregion ##########################################################################
  }
};
export default behavior;
function isRemoteCarrier(creep: Creep): creep is RemoteCarrier {
  return creep.memory.role === "remoteCarrier";
}
