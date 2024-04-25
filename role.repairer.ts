import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, commonHarvest, customMove, isStoreTarget, pickUpAll, randomWalk, stealBy } from "./util.creep";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isRepairer(creep)) {
    return console.log(`${creep.name} is not Repairer`);
  }

  // https://docs.screeps.com/simultaneous-actions.html

  // harvest
  commonHarvest(creep);

  // repair
  if (
    creep.memory.workTargetId ||
    (creep.memory.workTargetId = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s) => s.hits < s.hitsMax,
      ignoreCreeps: true,
    })?.id)
  ) {
    const target = Game.getObjectById(creep.memory.workTargetId);
    if (target && target.hits < target.hitsMax) {
      creep.memory.worked = creep.repair(target);
      switch (creep.memory.worked) {
        // 資源不足
        case ERR_NOT_ENOUGH_RESOURCES:
          changeMode(creep, "collecting");
          break;
        case ERR_NOT_IN_RANGE:
          if (creep.memory.mode === "working") {
            customMove(creep, target);
          }
          break;

        // 有りえない系
        case ERR_NOT_OWNER:
        case ERR_NO_BODYPART:
        case ERR_INVALID_TARGET:
          console.log(`${creep.name} repair returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
          creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
          break;
        // 問題ない系
        case OK:
        case ERR_BUSY:
        default:
          break;
      }
    } else {
      // 指定されていたソースが見つからないとき
      // 対象をクリアしてうろうろしておく
      creep.memory.workTargetId = undefined;
      randomWalk(creep);
    }
  }

  // withdraw
  if (
    creep.memory.storeId ||
    (creep.memory.storeId = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s): s is StoreTarget => {
        return isStoreTarget(s) && ![STRUCTURE_SPAWN, STRUCTURE_EXTENSION].some((t) => t === s.structureType) && s.store.getUsedCapacity(RESOURCE_ENERGY) !== 0;
      },
    })?.id)
  ) {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store) {
      creep.memory.collected = creep.withdraw(store, RESOURCE_ENERGY);
      switch (creep.memory.collected) {
        case ERR_NOT_ENOUGH_RESOURCES: // 空っぽ
          changeMode(creep, "collecting");
          break;
        case ERR_INVALID_TARGET: // 対象が変
          creep.memory.storeId = undefined;
          break;

        // 満タンまで取った
        case ERR_FULL:
          changeMode(creep, "working");
          break;
        case ERR_NOT_IN_RANGE:
          if (creep.memory.mode === "collecting") {
            const moved = customMove(creep, store);
            console.log(`${creep.name} ${RETURN_CODE_DECODER[moved.toString()]}`);
            moved !== OK && creep.say(RETURN_CODE_DECODER[moved.toString()]);
          }
          break;
        // 有りえない系
        case ERR_NOT_OWNER:
        case ERR_INVALID_ARGS:
          console.log(`${creep.name} build returns ${RETURN_CODE_DECODER[creep.memory.collected.toString()]}`);
          creep.say(RETURN_CODE_DECODER[creep.memory.collected.toString()]);
          break;
        // 問題ない系
        case OK:
        case ERR_BUSY:
        default:
          break;
      }
    } else {
      creep.memory.storeId = undefined;
    }
  }
  // 通りがかりから奪い取る
  stealBy(creep, ["harvester", "carrier", "upgrader"]);

  // 落っこちてるものを拾う
  pickUpAll(creep);

  // 空っぽになったら収集モードに切り替える
  if (creep.store[RESOURCE_ENERGY] === 0) {
    changeMode(creep, "collecting");
  }
  // 満タンだったら分配モードに切り替える
  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    changeMode(creep, "working");
  }
};

export default behavior;

function isRepairer(creep: Creeps): creep is Repairer {
  return creep.memory.role === "repairer";
}

function changeMode(creep: Repairer, mode: "working" | "collecting") {
  if (creep.memory.mode !== mode) {
    creep.say(mode);
    if (mode === "working") {
      creep.memory.mode = mode;
    } else {
      creep.memory.mode = creep.room.find(FIND_STRUCTURES, {
        filter: (s): s is StoreTarget => {
          return isStoreTarget(s) && s.store.getUsedCapacity(RESOURCE_ENERGY) !== 0;
        },
      })
        ? "collecting"
        : "harvesting";
    }
    creep.memory.workTargetId = undefined;
  }
}
