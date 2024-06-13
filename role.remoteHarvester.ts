import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, filterBodiesByCost, getCreepsInRoom, moveRoom, pickUpAll } from "./util.creep";
import { getSpawnsInRoom, readonly } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isRemoteHarvester(creep)) {
    return console.log(`${creep.name} is not RemoteHarvester`);
  }
  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) => {
    return customMove(creep, target, {
      ...opt,
    });
  };

  const memory = readonly(creep.memory);

  const targetRoom = Game.rooms[memory.targetRoomName] as Room | undefined;
  if (!targetRoom) {
    // 部屋が見えない場合
    // とにかく向かう
    return moveRoom(creep, creep.pos.roomName, memory.targetRoomName);
  }

  // 大体ここで0チェックして初期化するが
  // 切れてた時に向かっておきたいので初期化しない

  //#region 防衛##############################################################################
  const hostiles = creep.room.find(FIND_HOSTILE_CREEPS);
  const inverderCodre = creep.room.find(FIND_HOSTILE_STRUCTURES, { filter: (s): s is StructureInvaderCore => s.structureType === STRUCTURE_INVADER_CORE });
  const enemy = creep.pos.findClosestByRange(_.compact([...hostiles, ...inverderCodre]));
  if (enemy) {
    const defenders = getCreepsInRoom(creep.room).defender || [];
    if (defenders.length === 0) {
      const baseRoom = Game.rooms[memory.baseRoom];
      if (baseRoom && baseRoom.energyAvailable === baseRoom.energyCapacityAvailable) {
        const spawn = getSpawnsInRoom(baseRoom).find((s) => !s.spawning);
        if (spawn) {
          spawn.spawnCreep(filterBodiesByCost("defender", baseRoom.energyAvailable).bodies, `D_${creep.room.name}_${Game.time}`, {
            memory: {
              role: "defender",
              baseRoom: memory.targetRoomName,
              targetId: enemy.id,
            } as DefenderMemory,
          });
        }
      }
    }

    creep.rangedAttack(enemy);
    creep.attack(enemy);
  }
  //#endregion

  // #region harvest ###############################################################################
  // 対象設定処理(1体にするつもりなので排他とかしない)
  creep.memory.harvestTargetId = creep.memory.harvestTargetId || findHarvestTarget(creep, targetRoom)?.id;

  const source = memory.harvestTargetId && Game.getObjectById(memory.harvestTargetId);

  // 今のところ切り替え処理が要らないのでmemoryに保持しない
  const mode: "t" | "h" = creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0 ? "h" : "t";

  if (source) {
    _((creep.memory.worked = creep.harvest(source)))
      .tap((worked) => {
        switch (worked) {
          case ERR_NOT_IN_RANGE:
            if (mode === "h") {
              return moveMeTo(source);
            }
            return;
          case OK:
            return;

          // 通れないときと中身が無いときに初期化する
          case ERR_NOT_ENOUGH_ENERGY:
          case ERR_NO_PATH:
            creep.memory.harvestTargetId = undefined;
            return;
          default:
            creep.memory.harvestTargetId = undefined;
            creep.say(RETURN_CODE_DECODER[worked.toString()].replace("ERR_", ""));
            console.log(creep.name, "harvest", creep.saying);
        }
      })
      .run();
  } else {
    // 対象が見つからないときは初期化して処理を続ける
    creep.memory.harvestTargetId = undefined;
  }

  // #endregion ####################################################################################

  //#region transfer ##################################################################################
  if (source?.pos.isNearTo(creep)) {
    // 隣接してるとき
    // sourceに隣接したコンテナを取得する
    const container = source.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.pos.isNearTo(source) && s.store.getFreeCapacity(RESOURCE_ENERGY),
    });
    if (container) {
      _(creep.transfer(container, RESOURCE_ENERGY))
        .tap((result) => {
          switch (result) {
            case ERR_NOT_IN_RANGE:
              // いっぱいの時は寄る
              if (mode !== "h") {
                moveMeTo(container);
              }
              break;
            case OK:
            case ERR_FULL:
            case ERR_NOT_ENOUGH_ENERGY:
              return OK;
            default:
              creep.say(RETURN_CODE_DECODER[result.toString()].replace("ERR_", ""));
              console.log(creep.name, "transfer", creep.saying);
              break;
          }
        })
        .run();
    } else {
      creep.pos.createConstructionSite(STRUCTURE_CONTAINER);
    }
  }
  //#endregion

  //#region build ##################################################################################

  // 適当に建設を叩く
  if (source?.pos.isNearTo(creep)) {
    const site = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES);
    if (site) {
      creep.build(site);
    }
  }
  //#endregion

  //#region repair ##################################################################################

  // 射程内の修理はぜんぶ叩く
  if (source?.pos.isNearTo(creep)) {
    const damaged = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: (s) => s.hits < s.hitsMax });
    if (damaged) {
      creep.repair(damaged);
    }
  }
  //#endregion

  //#region withdraw ##################################################################################
  pickUpAll(creep);
  //#endregion
};
export default behavior;
function isRemoteHarvester(creep: Creep): creep is RemoteHarvester {
  return creep.memory.role === "remoteHarvester";
}

function findHarvestTarget(creep: RemoteHarvester, targetRoom: Room) {
  const sources = targetRoom.find(FIND_SOURCES);
  // 残ってる一番近いやつか、再生が一番早いやつ
  return (
    creep.pos.findClosestByPath(sources, { filter: (s) => s.energy > 0 }) ||
    _(sources)
      .sortBy((s) => s.ticksToRegeneration)
      .first()
  );
}
