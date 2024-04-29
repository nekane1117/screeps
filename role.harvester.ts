import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, commonHarvest, customMove, isStoreTarget, pickUpAll, randomWalk } from "./util.creep";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isHarvester(creep)) {
    return console.log(`${creep.name} is not Harvester`);
  }

  // https://docs.screeps.com/simultaneous-actions.html

  // harvest
  commonHarvest(creep);

  // transfer
  // 対象設定処理
  if (
    !(
      creep.memory.storeId ||
      (creep.memory.storeId = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s): s is StoreTarget => {
          const spawn = creep.pos.findClosestByRange(Object.values(Game.spawns));
          if (!spawn) {
            // 一番近いSpawnが無いときはエラーなので適当
            return false;
          }
          // 最寄りSpawnまでの距離
          const rangeToSpawn = creep.pos.getRangeTo(spawn);
          // 空きがあって最寄りSpawnまでより近いやつ
          return isStoreTarget(s) && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && creep.pos.getRangeTo(s) <= rangeToSpawn;
        },
        ignoreCreeps: true,
      })?.id)
    )
  ) {
    // 完全に見つからなければうろうろしておく
    if (creep.memory.mode === "working") {
      randomWalk(creep);
    }
  } else {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store) {
      const returnVal = creep.transfer(store, RESOURCE_ENERGY);
      switch (returnVal) {
        // 遠い
        case ERR_NOT_IN_RANGE:
          // 分配モードの時は倉庫に近寄る
          if (creep.memory.mode === "working") {
            customMove(creep, store, { range: 1 });
          }
          break;

        // 手持ちがない
        case ERR_NOT_ENOUGH_RESOURCES: // 値を指定しないから多分発生しない
          changeMode(creep, "harvesting");
          break;

        // 対象が変
        case ERR_INVALID_TARGET: // 対象が変
          creep.memory.storeId = undefined;
          break;
        case ERR_FULL: // 満タン
          creep.memory.storeId = undefined;
          break;

        // 有りえない系
        case ERR_NOT_OWNER: // 自creepじゃない
        case ERR_INVALID_ARGS: // 引数が変
          console.log(`${creep.name} transfer returns ${RETURN_CODE_DECODER[returnVal.toString()]}`);
          creep.say(RETURN_CODE_DECODER[returnVal.toString()]);
          break;

        // 問題ない系
        case OK:
        case ERR_BUSY: // spawining
        default:
          break;
      }
    } else {
      // 指定されていたソースが見つからないとき
      // 対象をクリアしてうろうろしておく
      creep.memory.storeId = undefined;
      randomWalk(creep);
    }
  }

  // 落っこちてるものを拾う
  pickUpAll(creep);

  // 空っぽになったら収集モードに切り替える
  if (creep.store[RESOURCE_ENERGY] === 0) {
    changeMode(creep, "harvesting");
  }
  // 満タンだったら分配モードに切り替える
  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    changeMode(creep, "working");
  }
};

export default behavior;

function isHarvester(creep: Creeps): creep is Harvester {
  return creep.memory.role === "harvester";
}

function changeMode(creep: Harvester, mode: HarvesterMemory["mode"]) {
  if (creep.memory.mode !== mode) {
    creep.say(mode);
    Object.assign(creep.memory, {
      mode,
      harvestTargetId: undefined,
      storeId: undefined,
    } as HarvesterMemory);
  }
}
