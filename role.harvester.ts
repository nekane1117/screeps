import { CreepBehavior } from "./roles";
import { complexOrder } from "./util.array";

import { RETURN_CODE_DECODER, customMove, moveRoom } from "./util.creep";
import { findMyStructures } from "./utils";

/**
 * sourceにとりついて資源を取り続けるだけで移動しない
 * 無いと困るので自分の周囲の建築だけする
 */
const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isHarvester(creep)) {
    console.log(`${creep.name} is not harvester`);
    return ERR_INVALID_TARGET;
  }

  // 違う部屋にいたらとりあえず目的の部屋に行く
  if (creep.room.name !== creep.memory.baseRoom) {
    return moveRoom(creep, creep.room.name, creep.memory.baseRoom);
  }

  // モード切替
  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.mode = "🚛";
  } else if (creep.store.energy === 0) {
    creep.memory.mode = "🌾";
  }

  const { container = [], link = [], spawn = [], extension = [], storage, factory, terminal } = findMyStructures(creep.room);

  //#region 収穫元設定処理 #####################################################################################
  if (!creep.memory.harvestTargetId) {
    creep.memory.harvestTargetId = complexOrder(creep.room.find(FIND_SOURCES), [
      // エネルギー降順
      (v) => -v.energy,
      // 再生までが一番早いやつ
      (v) => v.ticksToRegeneration,
    ]).first()?.id;
  }

  if (!creep.memory.harvestTargetId) {
    return ERR_NOT_FOUND;
  }
  //#endregion 収穫元設定処理 ##################################################################################

  if (creep.memory.mode === "🚛") {
    //#region 運搬処理 #####################################################################################
    // 輸送先が満タンになってたら消す
    if (creep.memory.transferId) {
      const store = Game.getObjectById(creep.memory.transferId);
      if (store && "store" in store && store.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        creep.memory.transferId = undefined;
      }
    }

    // 適当に一番近い容量があるやつに向かう
    creep.memory.transferId =
      creep.memory.transferId ||
      creep.pos.findClosestByPath(_.compact([...spawn, ...extension, storage, factory, terminal]).filter((s) => s.store.getFreeCapacity(RESOURCE_ENERGY)))?.id;
    const store = creep.memory.transferId && Game.getObjectById(creep.memory.transferId);
    if (store) {
      const returnVal = creep.transfer(store, RESOURCE_ENERGY);
      switch (returnVal) {
        // 対象が変
        case ERR_INVALID_TARGET: // 対象が変
        case ERR_FULL: // 満タン
          creep.memory.transferId = undefined;
          break;

        case ERR_NOT_IN_RANGE:
          customMove(creep, store);
          break;
        // 有りえない系
        case ERR_NOT_OWNER: // 自creepじゃない
        case ERR_INVALID_ARGS: // 引数が変
          console.log(`${creep.name} transfer returns ${RETURN_CODE_DECODER[returnVal.toString()]}`);
          creep.say(RETURN_CODE_DECODER[returnVal.toString()]);
          break;

        // 問題ない系
        case OK:
        case ERR_NOT_ENOUGH_RESOURCES: // 値を指定しないから多分発生しない
        case ERR_BUSY: // spawining
        default:
          break;
      }
    } else {
      // それでも見つからなければとりあえず終わる
      creep.memory.transferId = undefined;
    }

    //#endregion 運搬処理 ##################################################################################
  } else {
    //#region 収穫処理 #####################################################################################
    // harvest
    const source = Game.getObjectById(creep.memory.harvestTargetId);
    if (!source) {
      creep.memory.harvestTargetId = undefined;
      return;
    }
    creep.memory.worked = creep.harvest(source);

    if (!creep.pos.isNearTo(source)) {
      customMove(creep, source);
    }

    switch (creep.memory.worked) {
      case ERR_NOT_IN_RANGE:
        customMove(creep, source, {
          range: 1,
        });
        break;
      // 来ないはずのやつ
      case ERR_INVALID_TARGET: // 対象が変
      case ERR_NOT_OWNER: // 自creepじゃない
      case ERR_NOT_FOUND: // mineralは対象外
      case ERR_NO_BODYPART: // WORKが無い
        // とりあえずログを出して終わる
        console.log(`${creep.name} harvest returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
        creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
        break;
      // 大丈夫なやつ
      case OK: // OK
        break;
      case ERR_NOT_ENOUGH_RESOURCES: // 空っぽ
        creep.memory.harvestTargetId = undefined;
        break;
      case ERR_TIRED: // 疲れた
      case ERR_BUSY: // spawning
      default:
        creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
        break;
    }

    // 周囲にコンテナもリンクもなければコンテナを立てる
    if (
      creep.memory.worked === OK &&
      source.pos.findInRange(
        [...source.room.find(FIND_CONSTRUCTION_SITES, { filter: (s) => s.structureType === STRUCTURE_CONTAINER }), ...container, ...link],
        1,
      ).length === 0
    ) {
      creep.pos.createConstructionSite(STRUCTURE_CONTAINER);
    }
    //#endregion 収穫処理 ##################################################################################
  }
  let built: (CreepActionReturnCode | ERR_NOT_ENOUGH_RESOURCES | ERR_RCL_NOT_ENOUGH)[] = [];

  // build
  // 射程圏内の建設はとりあえずぜんぶ叩いておく
  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.getActiveBodyparts(WORK) * 5) {
    built = _(creep.pos.findInRange(Object.values(Game.constructionSites), 3))
      .sortBy((s) => s.progress - s.progressTotal)
      .map((site) => creep.build(site))
      .run();
  }

  // repair
  const repaired = _(creep.pos.findInRange(FIND_STRUCTURES, 3, { filter: (s) => "ticksToDecay" in s && s.hits < Math.min(s.hitsMax, 3000) }))
    .map((damaged) => {
      return creep.repair(damaged);
    })
    .run();

  // 周囲のものに適当に投げる
  if (built.length === 0 && creep.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.getActiveBodyparts(WORK) * 5 && repaired.length === 0) {
    if (creep.memory.mode === "🌾") {
      const source = creep.memory.harvestTargetId && Game.getObjectById(creep.memory.harvestTargetId);
      if (source) {
        let stores: AnyStoreStructure[] = source.pos.findInRange(link, 2);
        if (stores.length === 0) {
          stores = source.pos.findInRange(container, 2, {
            filter: (c: StructureContainer) => c.store.getFreeCapacity(RESOURCE_ENERGY),
          });
        }

        const store = creep.pos.findClosestByRange(stores);

        if (store) {
          if (creep.transfer(store, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            customMove(creep, store);
          }
        }
      }
    }
  }
};

export default behavior;

function isHarvester(c: Creeps): c is Harvester {
  return "role" in c.memory && c.memory.role === "harvester";
}
