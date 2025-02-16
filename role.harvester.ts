import { RETURN_CODE_DECODER, customMove, getMainSpawn, moveRoom, toColor } from "./util.creep";
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

  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) => {
    const pos = "pos" in target ? target.pos : target;
    Game.rooms[pos.roomName]?.visual.text("x", pos, {
      color: toColor(creep),
    });
    PathFinder.use(true);
    const result = customMove(creep, target, {
      maxRooms: 1,
      ...opt,
    });
    PathFinder.use(false);
    return result;
  };

  // モード切替
  const checkMode = () => {
    let newMode: "D" | "H" = creep.memory.mode;
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      newMode = "D";
    } else if (creep.store.energy === 0) {
      newMode = "H";
    }

    if (creep.memory.mode !== newMode) {
      creep.say(newMode);
      creep.memory.mode = newMode;
      delete creep.memory.transferId;
      delete creep.memory.harvestTargetId;
    }
  };
  checkMode();

  const { container = [], link = [] } = findMyStructures(creep.room);

  //#region 収穫元設定処理 #####################################################################################
  if (!creep.memory.harvestTargetId || Game.getObjectById(creep.memory.harvestTargetId)?.energy === 0) {
    delete creep.memory.harvestTargetId;
  }
  if (!creep.memory.harvestTargetId) {
    creep.memory.harvestTargetId = (getMainSpawn(creep.room) || creep).pos.findClosestByPath(FIND_SOURCES_ACTIVE)?.id;
  }

  if (!creep.memory.harvestTargetId) {
    return ERR_NOT_FOUND;
  }
  //#endregion 収穫元設定処理 ##################################################################################

  if (creep.memory.mode === "D") {
    //#region 運搬処理 #####################################################################################
    // 輸送先が満タンになってたら消す
    if (creep.memory.transferId) {
      const store = Game.getObjectById(creep.memory.transferId);
      if (store && "store" in store && store.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        creep.memory.transferId = undefined;
      }
    }

    const mineral = _.first(creep.room.find(FIND_MINERALS));
    // 適当に一番近い容量があるやつに向かう
    creep.memory.transferId =
      creep.memory.transferId ||
      creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s: AnyStructure): s is HasStore => {
          if ("store" in s) {
            // ミネラル用のコンテナだけは避ける
            const mineralContainer = container.filter((c) => !mineral || c.pos.inRangeTo(mineral, 3));

            return s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && !mineralContainer.find((c) => c.id === s.id);
          }
          return false;
        },
      })?.id;
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
          moveMeTo(store);
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
      moveMeTo(source, {
        maxRooms: 0,
      });
    }

    switch (creep.memory.worked) {
      case ERR_NOT_IN_RANGE:
        moveMeTo(source, {
          range: 1,
          maxRooms: 0,
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
  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.getActiveBodyparts(WORK) * BUILD_POWER) {
    built = _(
      creep.pos.findInRange(
        Object.values(Game.constructionSites).filter((s) => s.structureType === STRUCTURE_CONTAINER),
        3,
      ),
    )
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
  if (built.length === 0 && creep.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.getActiveBodyparts(WORK) * BUILD_POWER && repaired.length === 0) {
    if (creep.memory.mode === "H") {
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
            moveMeTo(store, {
              maxRooms: 0,
            });
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
