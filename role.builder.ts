import { CreepBehavior } from "./roles";
import { complexOrder } from "./util.array";
import { RETURN_CODE_DECODER, customMove, isStoreTarget, pickUpAll, withdrawBy } from "./util.creep";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isBuilder(creep)) {
    return console.log(`${creep.name} is not Builder`);
  }

  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    changeMode(creep, "💪");
  }
  if (creep.store.energy < BUILD_POWER * creep.getActiveBodyparts(WORK)) {
    changeMode(creep, "🛒");
  }
  // https://docs.screeps.com/simultaneous-actions.html

  // build
  if (
    creep.memory.buildingId ||
    (creep.memory.buildingId = complexOrder(Object.values(Game.constructionSites), [
      // 同じ部屋を優先
      (s) => (s.room?.name === creep.memory.baseRoom ? 0 : 1),
      // コンテナがあるときはコンテナ優先
      (s) => (s.structureType === STRUCTURE_CONTAINER ? 0 : 1),
      // 残り作業が一番少ないやつ
      (s) => s.progressTotal - s.progress,
    ]).first()?.id)
  ) {
    const site = Game.getObjectById(creep.memory.buildingId);
    if (site) {
      switch ((creep.memory.built = creep.build(site))) {
        case ERR_NOT_ENOUGH_RESOURCES:
          // 手持ちが足らないときは収集モードに切り替える
          changeMode(creep, "🛒");
          break;
        // 対象が変な時はクリアする
        case ERR_INVALID_TARGET:
          creep.memory.buildingId = undefined;
          break;
        // 建築モードで離れてるときは近寄る
        case ERR_NOT_IN_RANGE:
          if (creep.memory.mode === "💪") {
            customMove(creep, site);
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
        default:
          break;
      }
    } else {
      // 指定されていたソースが見つからないとき
      // 対象をクリア
      creep.memory.buildingId = undefined;
    }
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
          s.store.energy > 0
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

        // 満タンまで取った
        case ERR_FULL:
          changeMode(creep, "💪");
          break;
        case ERR_NOT_IN_RANGE:
          if (creep.memory.mode === "🛒") {
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
          if (store.store.getUsedCapacity(RESOURCE_ENERGY) < creep.getActiveBodyparts(CARRY) * CARRY_CAPACITY) {
            creep.memory.storeId = undefined;
            changeMode(creep, "💪");
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
const changeMode = (creep: Builder, mode: "💪" | "🛒") => {
  if (mode !== creep.memory.mode) {
    creep.memory.mode = mode;
    creep.memory.buildingId = undefined;
    creep.memory.storeId = undefined;
    creep.say(creep.memory.mode);
  }
};
