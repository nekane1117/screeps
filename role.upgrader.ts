import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, isStoreTarget, pickUpAll } from "./util.creep";

const behavior: CreepBehavior = (creep: Creeps) => {
  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) =>
    customMove(creep, target, {
      ...opt,
    });

  if (!isUpgrader(creep)) {
    return console.log(`${creep.name} is not Upgrader`);
  }
  if (creep.name.startsWith("B") && Object.values(Game.constructionSites).length) {
    return Object.assign(creep.memory, { role: "builder", mode: "🛒" } as BuilderMemory);
  }

  const controller = Game.rooms[creep.memory.baseRoom]?.controller;
  if (!controller) {
    return creep.suicide();
  }

  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    changeMode(creep, "💪");
  } else if (creep.store.energy === 0) {
    changeMode(creep, "🛒");
  }

  // https://docs.screeps.com/simultaneous-actions.html

  // signController
  if (controller.sign?.username !== "Nekane") {
    const signed = creep.signController(controller, "Please teach me screeps");
    if (signed === ERR_NOT_IN_RANGE) {
      moveMeTo(controller);
    } else {
      console.log(`${creep.name}:${RETURN_CODE_DECODER[signed.toString()]}`);
    }
  }

  // upgradeController
  creep.memory.worked = creep.upgradeController(controller);

  switch (creep.memory.worked) {
    // 資源不足
    case ERR_NOT_ENOUGH_RESOURCES:
      changeMode(creep, "🛒");
      break;
    case ERR_NOT_IN_RANGE:
      if (creep.memory.mode === "💪") {
        moveMeTo(controller, { range: 3 });
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

  if (creep.memory.storeId && (Game.getObjectById(creep.memory.storeId)?.store.energy || 0) <= 0) {
    creep.memory.storeId = undefined;
  }

  // withdraw
  if (
    creep.memory.storeId ||
    (creep.memory.storeId = controller.pos.findClosestByRange(FIND_STRUCTURES, {
      // コントローラーから3マス以内の一番近い倉庫に行く
      filter: (s: Structure): s is StoreTarget => {
        return isStoreTarget(s) && ![STRUCTURE_SPAWN, STRUCTURE_EXTENSION].some((t) => t === s.structureType);
      },
    })?.id)
  ) {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store) {
      if (creep.memory.mode === "🛒") {
        const moved = moveMeTo(store);
        if (moved !== OK) {
          console.log(`${creep.name} ${RETURN_CODE_DECODER[moved.toString()]}`);
          creep.say(RETURN_CODE_DECODER[moved.toString()]);
        }
      }
      creep.memory.collected = creep.withdraw(store, RESOURCE_ENERGY);
      switch (creep.memory.collected) {
        case ERR_INVALID_TARGET: // 対象が変
          creep.memory.storeId = undefined;
          break;

        // 満タンまで取った
        case ERR_FULL:
          changeMode(creep, "💪");
          break;
        case ERR_NOT_IN_RANGE:
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
        case ERR_NOT_ENOUGH_RESOURCES: // 空っぽ
        default:
          break;
      }
    }
  }

  // withdraw
  // 落っこちてるものを拾う
  pickUpAll(creep);
};

export default behavior;

function isUpgrader(creep: Creep): creep is Upgrader {
  return creep.memory.role === "upgrader";
}
const changeMode = (creep: Upgrader, mode: UpgraderMemory["mode"]) => {
  if (mode !== creep.memory.mode) {
    creep.say(mode);
    creep.memory.storeId = undefined;
    creep.memory.mode = mode;
  }
};
