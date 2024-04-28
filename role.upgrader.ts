import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, isStoreTarget, pickUpAll, randomWalk } from "./util.creep";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isUpgrader(creep)) {
    return console.log(`${creep.name} is not Upgrader`);
  }

  if (!creep.room.controller) {
    return creep.suicide();
  }
  // https://docs.screeps.com/simultaneous-actions.html

  // signController
  if (creep.room.controller.sign?.username !== "Nekane" && creep.name.endsWith("0")) {
    const signed = creep.signController(creep.room.controller, "Please teach me screeps");
    if (signed === ERR_NOT_IN_RANGE) {
      customMove(creep, creep.room.controller);
    } else {
      console.log(`${creep.name}:${RETURN_CODE_DECODER[signed.toString()]}`);
    }
  }

  // upgradeController
  creep.memory.worked = creep.upgradeController(creep.room.controller);

  switch (creep.memory.worked) {
    // 資源不足
    case ERR_NOT_ENOUGH_RESOURCES:
      changeMode(creep, "collecting");
      break;
    case ERR_NOT_IN_RANGE:
      if (creep.memory.mode === "working") {
        customMove(creep, creep.room.controller);
      }
      break;
    // 有りえない系
    case ERR_NOT_OWNER:
    case ERR_INVALID_TARGET:
    case ERR_NO_BODYPART:
      console.log(`${creep.name} upgradeController returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
      creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
      break;
    // 問題ない系
    case OK:
    case ERR_BUSY:
    default:
      break;
  }

  if (
    creep.memory.storeId ||
    (creep.memory.storeId = creep.room.controller.pos.findClosestByPath(FIND_STRUCTURES, {
      // コントローラーから一番近い倉庫に行く
      filter: (s: Structure): s is StoreTarget => {
        return isStoreTarget(s) && ![STRUCTURE_SPAWN, STRUCTURE_EXTENSION].some((t) => t === s.structureType) && s.store[RESOURCE_ENERGY] > 0;
      },
    })?.id)
  ) {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store) {
      creep.memory.collected = creep.withdraw(store, RESOURCE_ENERGY);
      switch (creep.memory.collected) {
        case ERR_NOT_ENOUGH_RESOURCES: // 空っぽ
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
            if (moved !== OK) {
              console.log(`${creep.name} ${RETURN_CODE_DECODER[moved.toString()]}`);
              creep.say(RETURN_CODE_DECODER[moved.toString()]);
            }
          }
          break;
        // 有りえない系
        case ERR_NOT_OWNER:
        case ERR_INVALID_ARGS:
          console.log(`${creep.name} build returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
          creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
          break;
        // 問題ない系
        case OK:
        case ERR_BUSY:
        default:
          break;
      }
    } else {
      creep.memory.storeId = undefined;
      randomWalk(creep);
    }
  } else {
    randomWalk(creep);
  }

  // withdraw
  // 落っこちてるものを拾う
  pickUpAll(creep);

  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    changeMode(creep, "working");
  } else if (creep.store[RESOURCE_ENERGY] === 0) {
    changeMode(creep, "collecting");
  }
};

export default behavior;

function isUpgrader(creep: Creep): creep is Upgrader {
  return creep.memory.role === "upgrader";
}
const changeMode = (creep: Upgrader, mode: UpgraderMemory["mode"]) => {
  if (mode !== creep.memory.mode) {
    creep.say(mode);
    creep.memory.mode = mode;
    creep.memory.harvestTargetId = undefined;
    creep.memory.harvested = undefined;
  }
};
