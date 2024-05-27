import { CreepBehavior } from "./roles";
import { complexOrder } from "./util.array";
import { RETURN_CODE_DECODER, customMove, isStoreTarget, pickUpAll, withdrawBy } from "./util.creep";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isBuilder(creep)) {
    return console.log(`${creep.name} is not Builder`);
  }
  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) =>
    customMove(creep, target, {
      ignoreCreeps: !creep.pos.inRangeTo(target, 4),
      ...opt,
    });

  const checkMode = () => {
    const newMode: BuilderMemory["mode"] = ((c: Builder) => {
      if (c.memory.mode === "💪" && c.store.energy === 0) {
        // 作業モードで空になったら収集モードにする
        return "🛒";
      }

      if (c.memory.mode === "🛒" && creep.store.energy > CARRY_CAPACITY) {
        // 収集モードで50超えたら作業モードにする
        return "💪";
      }

      // そのまま
      return c.memory.mode;
    })(creep);
    if (newMode !== creep.memory.mode) {
      creep.memory.mode = newMode;
      creep.memory.buildingId = undefined;
      creep.memory.storeId = undefined;
      creep.say(creep.memory.mode);
    }
  };
  checkMode();

  // https://docs.screeps.com/simultaneous-actions.html

  // build
  if (
    creep.memory.buildingId ||
    (creep.memory.buildingId = complexOrder(Object.values(Game.constructionSites), [
      // 同じ部屋を優先
      (s) => (s.pos.roomName === creep.memory.baseRoom ? 0 : 1),
      // コンテナがあるときはコンテナ優先
      (s) => {
        switch (s.structureType) {
          case STRUCTURE_CONTAINER:
            return 0;
          default:
            return 1;
        }
      },
      // 残り作業が一番少ないやつ
      (s) => s.progressTotal - s.progress,
      // 近いやつ
      (s) => s.pos.getRangeTo(creep),
    ]).first()?.id)
  ) {
    const site = Game.getObjectById(creep.memory.buildingId);
    if (site) {
      switch ((creep.memory.built = creep.build(site))) {
        // 対象が変な時はクリアする
        case ERR_INVALID_TARGET:
          creep.memory.buildingId = undefined;
          break;
        // 建築モードで離れてるときは近寄る
        case ERR_NOT_IN_RANGE:
          if (creep.memory.mode === "💪") {
            moveMeTo(site);
          }
          break;

        // 有りえない系
        case ERR_NOT_OWNER: // 自creepじゃない
        case ERR_NO_BODYPART:
          console.log(`${creep.name} build returns ${RETURN_CODE_DECODER[creep.memory.built.toString()]}`);
          creep.say(RETURN_CODE_DECODER[creep.memory.built.toString()]);
          break;

        // 問題ない系
        case OK:
        case ERR_BUSY:
        case ERR_NOT_ENOUGH_RESOURCES:
        default:
          break;
      }
    } else {
      // 指定されていたソースが見つからないとき
      // 対象をクリア
      creep.memory.buildingId = undefined;
    }
  } else {
    // 強引に修理屋になっておく
    return Object.assign(creep.memory, { role: "upgrader", mode: "🛒" } as UpgraderMemory);
  }

  const upgradeContainer =
    creep.room?.controller &&
    _(creep.room.controller.pos.findInRange(FIND_STRUCTURES, 3, { filter: (s): s is StructureContainer => s.structureType === STRUCTURE_CONTAINER })).first();

  // withdraw
  if (
    creep.memory.storeId ||
    (creep.memory.storeId = (
      upgradeContainer ||
      creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s): s is StoreTarget => {
          return (
            s.structureType !== STRUCTURE_SPAWN &&
            isStoreTarget(s) &&
            s.structureType !== STRUCTURE_LINK &&
            (s.room.energyAvailable / s.room.energyCapacityAvailable > 0.9 ? true : s.structureType !== STRUCTURE_EXTENSION) &&
            s.store.energy > CARRY_CAPACITY * creep.getActiveBodyparts(CARRY)
          );
        },
        maxRooms: 2,
      })
    )?.id)
  ) {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store) {
      creep.memory.worked = creep.withdraw(store, RESOURCE_ENERGY);
      switch (creep.memory.worked) {
        case ERR_NOT_ENOUGH_RESOURCES: // 空っぽ
        case ERR_INVALID_TARGET: // 対象が変
          creep.memory.storeId = undefined;
          break;
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
          console.log(`${creep.name} build returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
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

function isBuilder(creep: Creep): creep is Builder {
  return creep.memory.role === "builder";
}
