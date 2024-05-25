import { CreepBehavior } from "./roles";
import { complexOrder } from "./util.array";
import { RETURN_CODE_DECODER, customMove, getRepairTarget, isStoreTarget, pickUpAll, withdrawBy } from "./util.creep";
import { findMyStructures } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isRepairer(creep)) {
    return console.log(`${creep.name} is not Repairer`);
  }
  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) =>
    customMove(creep, target, {
      ignoreCreeps: !creep.pos.inRangeTo(target, 2),
      ...opt,
    });

  const checkMode = () => {
    const newMode: RepairerMemory["mode"] = creep.store.energy >= CARRY_CAPACITY ? "🔧" : "🛒";
    if (newMode !== creep.memory.mode) {
      creep.memory.mode = newMode;
      creep.memory.targetId = undefined;
      creep.memory.storeId = undefined;
      creep.say(creep.memory.mode);
    }
  };
  checkMode();

  // https://docs.screeps.com/simultaneous-actions.html

  // 空きのあるタワーがあるときはそちらに運ぶ
  if (creep.memory.towerId || (creep.memory.towerId = findMyStructures(creep.room).tower.find((t) => t.store.getFreeCapacity(RESOURCE_ENERGY) > 0)?.id)) {
    const tower = Game.getObjectById(creep.memory.towerId);
    if (!tower) {
      creep.memory.towerId = undefined;
      return;
    }

    if (creep.transfer(tower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      moveMeTo(tower);
    }
  }
  // repair
  else if (
    (creep.memory.targetId = complexOrder(getRepairTarget(creep.memory.baseRoom), [
      // 同じ部屋を優先
      (s) => (s.pos.roomName === creep.pos.roomName ? 0 : 1),
      // 壊れそうな壁を優先
      (s) => {
        switch (s.structureType) {
          case STRUCTURE_WALL:
          case STRUCTURE_RAMPART:
            if (s.hits < 3000) {
              return "ticksToDecay" in s ? s.hits * RAMPART_DECAY_TIME + s.ticksToDecay : s.hits * RAMPART_DECAY_TIME;
            } else {
              return 30001 * RAMPART_DECAY_TIME;
            }
          default:
            return 30001 * RAMPART_DECAY_TIME;
        }
      },
      // 多少非効率でもすぐ壊れそうなやつから
      (s) => s.hits,
    ]).first()?.id)
  ) {
    // repair
    const target = Game.getObjectById(creep.memory.targetId);
    if (target) {
      switch (creep.repair(target)) {
        case ERR_NOT_IN_RANGE:
          if (creep.memory.mode === "🔧") {
            moveMeTo(target);
          }
          break;
        case OK:
        default:
          break;
      }
    }
  }

  // 向かってる途中とかに空になったらクリアする
  if ((creep.memory.storeId && Game.getObjectById(creep.memory.storeId))?.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.storeId = undefined;
  }

  // withdraw
  if (
    creep.memory.storeId ||
    (creep.memory.storeId = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s): s is StoreTarget => {
        return (
          s.structureType !== STRUCTURE_SPAWN &&
          isStoreTarget(s) &&
          s.structureType !== STRUCTURE_LINK &&
          (s.room.energyAvailable / s.room.energyCapacityAvailable > 0.9 ? true : s.structureType !== STRUCTURE_EXTENSION) &&
          s.store.energy > CARRY_CAPACITY
        );
      },
    })?.id)
  ) {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store) {
      creep.memory.worked = creep.withdraw(store, RESOURCE_ENERGY);
      switch (creep.memory.worked) {
        case ERR_NOT_ENOUGH_RESOURCES: // 空っぽ
        case ERR_INVALID_TARGET: // 対象が変
          creep.memory.storeId = undefined;
          break;
        case ERR_NOT_IN_RANGE:
          if (creep.memory.mode === "🛒") {
            const moved = moveMeTo(store);
            if (moved !== OK) {
              console.log(`${creep.name} ${RETURN_CODE_DECODER[moved.toString()]}`);
              creep.say(RETURN_CODE_DECODER[moved.toString()]);
            }
          }
          break;
        // 有りえない系
        case ERR_NOT_OWNER:
        case ERR_INVALID_ARGS:
          console.log(`${creep.name} withdraw returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
          creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
          break;
        // 問題ない系
        case OK:
        case ERR_FULL:
        case ERR_BUSY:
        default:
          if (store.store.getUsedCapacity(RESOURCE_ENERGY) < creep.getActiveBodyparts(CARRY) * CARRY_CAPACITY) {
            creep.memory.storeId = undefined;
          }
          break;
      }
    }
  }

  // withdraw
  withdrawBy(creep, ["harvester", "upgrader"]);

  // 落っこちてるものを拾う
  pickUpAll(creep);
};

export default behavior;

function isRepairer(creep: Creep): creep is Repairer {
  return creep.memory.role === "repairer";
}
