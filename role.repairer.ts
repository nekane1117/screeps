import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, isStoreTarget, pickUpAll, randomWalk } from "./util.creep";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isRepairer(creep)) {
    return console.log(`${creep.name} is not Repairer`);
  }

  // https://docs.screeps.com/simultaneous-actions.html

  // repair
  if (
    creep.memory.workTargetId ||
    (creep.memory.workTargetId = creep.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (s) => s.structureType !== STRUCTURE_WALL && s.hits < s.hitsMax,
    })?.id)
  ) {
    const target = Game.getObjectById(creep.memory.workTargetId);
    if (target && target.hits < target.hitsMax) {
      creep.memory.worked = creep.repair(target);
      switch (creep.memory.worked) {
        // 資源不足
        case ERR_NOT_ENOUGH_RESOURCES:
          changeMode(creep, "🛒");
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
          creep.memory.workTargetId = _(creep.pos.findInRange(FIND_STRUCTURES, 3, { filter: (s) => s.hits < s.hitsMax })).min((s) => s.hits)?.id;
        // eslint-disable-next-line no-fallthrough
        case ERR_NOT_IN_RANGE:
          if (creep.memory.mode === "💪") {
            customMove(creep, target);
          }
          break;
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
          changeMode(creep, "🛒");
          break;
        case ERR_INVALID_TARGET: // 対象が変
          creep.memory.storeId = undefined;
          break;

        // 満タンまで取った
        case ERR_FULL:
          changeMode(creep, "💪");
          break;
        case ERR_NOT_IN_RANGE:
          if (creep.memory.mode === "🛒") {
            const moved = customMove(creep, store);
            moved !== OK && (console.log(`${creep.name} ${RETURN_CODE_DECODER[moved.toString()]}`), creep.say(RETURN_CODE_DECODER[moved.toString()]));
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

  // 落っこちてるものを拾う
  pickUpAll(creep);

  // 空っぽになったら収集モードに切り替える
  if (creep.store[RESOURCE_ENERGY] === 0) {
    changeMode(creep, "🛒");
  }
  // 満タンだったら分配モードに切り替える
  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    changeMode(creep, "💪");
  }
};

export default behavior;

function isRepairer(creep: Creeps): creep is Repairer {
  return creep.memory.role === "repairer";
}

function changeMode(creep: Repairer, mode: "💪" | "🛒") {
  if (creep.memory.mode !== mode) {
    creep.say(mode);
    if (mode === "💪") {
      creep.memory.mode = mode;
    } else {
      creep.memory.mode = creep.room.find(FIND_STRUCTURES, {
        filter: (s): s is StoreTarget => {
          return isStoreTarget(s) && s.store.getUsedCapacity(RESOURCE_ENERGY) !== 0;
        },
      })
        ? "🛒"
        : "🌾";
    }
    creep.memory.workTargetId = undefined;
  }
}
