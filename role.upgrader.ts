import { RETURN_CODE_DECODER, customMove, getMainSpawn, pickUpAll } from "./util.creep";
import { findMyStructures, getCapacityRate, getLabs, getSitesInRoom } from "./utils";

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

  if (boost(creep) !== OK) {
    return;
  }
  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    changeMode(creep, "W");
  } else if (creep.store.energy === 0) {
    changeMode(creep, "G");
  }

  const { link, container } = findMyStructures(creep.room);

  const links = link.filter((l) => {
    const s = getMainSpawn(creep.room);
    return !(s && l.pos.inRangeTo(s, 1));
  });
  // https://docs.screeps.com/simultaneous-actions.html

  // signController
  if (controller.sign?.username !== "Nekane" || controller.sign?.text !== SIGN) {
    const signed = creep.signController(controller, SIGN);
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
        changeMode(creep, "G");
        break;
      case ERR_NOT_IN_RANGE:
        if (creep.memory.mode === "W") {
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
  }

  if (creep.memory.storeId && (Game.getObjectById(creep.memory.storeId)?.store.energy || 0) <= 0) {
    creep.memory.storeId = undefined;
  }

  // withdraw
  if (
    creep.memory.storeId ||
    (creep.memory.storeId = _([...links, ...container])
      .compact()
      .filter((c: StructureLink | StructureContainer) => {
        return c.store.energy > 0 && c.room.controller?.pos.inRangeTo(c, 3);
      })
      .sort((c) => {
        switch (c.structureType) {
          case "link":
            return 0;

          default:
            return 1;
        }
      })
      .first()?.id)
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
          changeMode(creep, "W");
          break;
        case ERR_NOT_IN_RANGE:
          if (creep.memory.mode === "G") {
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
          if (creep.memory.worked) {
            creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
          }
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

// ブースト優先度順
const BOOSTS = [RESOURCE_CATALYZED_GHODIUM_ACID, RESOURCE_GHODIUM_ACID, RESOURCE_GHODIUM_HYDRIDE];

function boost(creep: Upgrader) {
  const minBoosted = _(creep.body.filter((b) => b.type === WORK)).min((b) => (b.boost || "").length).boost;

  // 完全にboostされてるときは無視
  if (minBoosted === RESOURCE_CATALYZED_GHODIUM_ACID || minBoosted === RESOURCE_GHODIUM_ACID) {
    return OK;
  }

  const labs = getLabs(creep.room);
  const target = labs
    // 型が正しくて容量があるやつだけにする
    .filter((l) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return l.memory.expectedType && BOOSTS.includes(l.memory.expectedType as any) && l.store.getUsedCapacity(l.memory.expectedType) > LAB_BOOST_MINERAL;
    })
    // 優先順で一番優先のやつ
    .sort((l) => {
      const idx = (l.memory.expectedType && BOOSTS.findIndex((b) => b === l.memory.expectedType)) || -1;
      if (idx > 0) {
        return idx;
      } else {
        return Infinity;
      }
    })
    .run()?.[0];

  if (!target) {
    return OK;
  }

  const result = target.boostCreep(creep);
  if (result === ERR_NOT_IN_RANGE) {
    customMove(creep, target);
  }
  return result;
}

const SIGN = "Please see github nekane1117/screeps";
