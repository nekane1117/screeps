import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, filterBodiesByCost, getCreepsInRoom, moveRoom, pickUpAll } from "./util.creep";
import { findMyStructures, getSitesInRoom, getSpawnsInRoom, readonly } from "./utils";

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
  if (!targetRoom || creep.memory.targetRoomName !== creep.memory.baseRoom) {
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

  // #region モードチェック ###############################################################################
  if (creep.memory.targetRoomName !== creep.pos.roomName) {
    // 部屋にいないときはとにかく向かう
    creep.memory.mode = "🌾";
  } else if (creep.memory.mode === "🌾" && creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0 && getSitesInRoom(creep.room).length) {
    // 収穫モードで満タン持っててサイトがあるときは建てる
    creep.memory.mode = "👷";
  } else if (creep.store.energy === 0 || getSitesInRoom(creep.room).length === 0) {
    // 部屋にいないときはとにかく向かう
    creep.memory.mode = "🌾";
  }

  //#endregion

  if (creep.memory.mode === "🌾") {
    // #region harvest ###############################################################################
    // 対象設定処理(1体にするつもりなので排他とかしない)
    creep.memory.harvestTargetId = creep.memory.harvestTargetId || findHarvestTarget(creep, targetRoom)?.id;

    const source = memory.harvestTargetId && Game.getObjectById(memory.harvestTargetId);

    if (source) {
      _((creep.memory.worked = creep.harvest(source)))
        .tap((worked) => {
          switch (worked) {
            case ERR_NOT_IN_RANGE:
              if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                moveMeTo(source);
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

    //#region sourceの隣にいるとき ##################################################################################
    if (source?.pos.isNearTo(creep)) {
      const site = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES, { filter: (s) => s.pos.inRangeTo(creep, 3) });
      const damaged = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: (s) => s.hits < s.hitsMax && s.pos.inRangeTo(creep, 3) });
      //#region build ##################################################################################
      if (site || damaged) {
        if (site) {
          creep.build(site);
        }
        //#endregion
        //#region repair ##################################################################################
        if (damaged) {
          creep.repair(damaged);
        }
        //#endregion
      } else {
        //#region transfer ##################################################################################
        // 隣接してるとき
        const { container: containers } = findMyStructures(creep.room);

        // sourceに隣接したコンテナを取得する
        const container = source.pos.findClosestByRange([...containers, ...getSitesInRoom(creep.room)], {
          filter: (s: Structure | ConstructionSite) => s.structureType === STRUCTURE_CONTAINER && s.pos.isNearTo(source),
        });
        if (container) {
          if (!("progress" in container)) {
            if (creep.store.energy > creep.getActiveBodyparts(WORK)) {
              _(creep.transfer(container, RESOURCE_ENERGY))
                .tap((result) => {
                  switch (result) {
                    case ERR_NOT_IN_RANGE:
                      // いっぱいの時は寄る
                      if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
                        moveMeTo(source);
                      }
                      return;
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
            }
          }
        } else {
          creep.pos.createConstructionSite(STRUCTURE_CONTAINER);
        }
        //#endregion
      }
    }
    // #endregion ####################################################################################
  } else {
    //#region 建設モード ##################################################################################
    const site = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES);
    if (site && creep.build(site) === ERR_NOT_IN_RANGE) {
      moveMeTo(site);
    }
    //#endregion
  }
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
