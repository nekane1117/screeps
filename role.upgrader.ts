import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, getMainSpawn, pickUpAll } from "./util.creep";
import { findMyStructures, getCapacityRate, getSitesInRoom } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) =>
    customMove(creep, target, {
      ...opt,
    });

  if (!isUpgrader(creep)) {
    return console.log(`${creep.name} is not Upgrader`);
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

  const { link, container } = findMyStructures(creep.room);

  const links = link.filter((l) => {
    const s = getMainSpawn(creep.room);
    return !(s && l.pos.inRangeTo(s, 1));
  });
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

  const myContainer = controller.pos.findClosestByRange(container, {
    filter: (c: StructureContainer) => {
      return c.pos.inRangeTo(controller, 3);
    },
  });

  // 建設がないときかダウングレードしちゃいそうなとき
  if (
    controller.ticksToDowngrade < 1000 ||
    getSitesInRoom(controller.room).length === 0 ||
    (myContainer && getCapacityRate(myContainer, RESOURCE_ENERGY) > 0.5)
  ) {
    // upgradeController
    creep.memory.worked = creep.upgradeController(controller);

    switch (creep.memory.worked) {
      // 資源不足
      case ERR_NOT_ENOUGH_RESOURCES:
        changeMode(creep, "🛒");
        break;
      case ERR_NOT_IN_RANGE:
        if (creep.memory.mode === "💪") {
          moveMeTo(controller);
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
  }

  if (creep.memory.storeId && (Game.getObjectById(creep.memory.storeId)?.store.energy || 0) <= 0) {
    creep.memory.storeId = undefined;
  }

  // withdraw
  if (
    creep.memory.storeId ||
    ((creep.memory.storeId = controller.pos.findClosestByRange(_.compact([...links, ...container]))?.id),
    {
      filter: (c: StructureLink | StructureContainer) => {
        return c.store.energy > 0 && c.room.controller?.pos.inRangeTo(c, 3);
      },
    }) ||
    (creep.memory.storeId = (() => {
      if (creep.room.energyAvailable < creep.room.energyCapacityAvailable) {
        return undefined;
      } else {
        return controller.pos.findClosestByRange(
          _.compact([
            ...links,
            ...container,
            ..._([creep.room.storage, creep.room.terminal])
              .compact()
              .filter((s) => s?.store.energy > creep.room.energyCapacityAvailable)
              .value(),
          ]),
          {
            filter: (s: StructureLink | StructureContainer | StructureStorage | StructureTerminal) => {
              return s.store.energy > 0;
            },
          },
        );
      }
    })()?.id)
  ) {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store) {
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
          console.log(`${creep.name} build returns ${creep.memory.worked && RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
          creep.memory.worked && creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
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
