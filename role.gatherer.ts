import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, getMainSpawn } from "./util.creep";
import { findMyStructures } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  const { room } = creep;

  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) => {
    customMove(creep, target, {
      plainCost: 2,
      swampCost: 5,
      ...opt,
    });
  };
  if (!isGatherer(creep)) {
    return console.log(`${creep.name} is not Gatherer`);
  }

  if (!creep.room.storage) {
    return creep.suicide();
  }

  function checkMode() {
    if (!isGatherer(creep)) {
      return console.log(`${creep.name} is not Gatherer`);
    }
    const newMode = ((c: Gatherer) => {
      if (c.memory.mode === "🚛" && creep.store.getUsedCapacity() === 0) {
        // 作業モードで空になったら収集モードにする
        return "🛒";
      }

      if (
        c.memory.mode === "🛒" &&
        creep.store.getUsedCapacity() >=
          Math.min(creep.store.getCapacity(RESOURCE_ENERGY), creep.room.controller ? EXTENSION_ENERGY_CAPACITY[creep.room.controller.level] : CARRY_CAPACITY)
      ) {
        // 収集モードで半分超えたら作業モードにする
        return "🚛";
      }

      // そのまま
      return c.memory.mode;
    })(creep);

    if (creep.memory.mode !== newMode) {
      creep.say(newMode);
      creep.memory.mode = newMode;
      if (newMode === "🛒") {
        creep.memory.storeId = undefined;
      }

      // 運搬モードに切り替えたときの容量を記憶する
      if (newMode === "🚛") {
        (creep.room.memory.carrySize = creep.room.memory.carrySize || {}).gatherer =
          ((creep.room.memory.carrySize?.gatherer || 100) * 100 + creep.store.energy) / 101;
      }
    }
  }
  checkMode();
  const center = room.storage || getMainSpawn(room);
  if (!center) {
    return creep.say("center not found");
  }
  // https://docs.screeps.com/simultaneous-actions.html

  // 取得元設定処理###############################################################################################

  // 取得元が空になってたら消す
  if (creep.memory.storeId) {
    const store = Game.getObjectById(creep.memory.storeId);
    if (!store || (store && "store" in store && store.store.energy < CARRY_CAPACITY)) {
      creep.memory.storeId = undefined;
    }
  }
  // 今持ってるやつと同じタイプの資源を盛ってる廃墟
  if (!creep.memory.storeId) {
    creep.memory.storeId = creep.pos.findClosestByPath(FIND_TOMBSTONES, {
      filter: (r: Tombstone) => {
        return r.store.getUsedCapacity() !== 0;
      },
    })?.id;
  }

  // 今持ってるやつと同じタイプの資源を盛ってる廃墟
  if (!creep.memory.storeId) {
    creep.memory.storeId = creep.pos.findClosestByPath(FIND_RUINS, {
      filter: (r: Ruin) => {
        return r.store.getUsedCapacity() !== 0;
      },
    })?.id;
  }

  // 中身ある廃墟がなければリサイクル
  if (!creep.memory.storeId) {
    const spawn = creep.pos.findClosestByPath(findMyStructures(creep.room).spawn);
    return spawn?.recycleCreep(creep) === ERR_NOT_IN_RANGE && customMove(creep, spawn.pos);
  }
  // 取り出し処理###############################################################################################
  if (creep.memory.storeId && creep.memory.mode === "🛒") {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store) {
      if (!creep.pos.isNearTo(store)) {
        moveMeTo(store, { range: 1 });
      }

      if (creep.pos.isNearTo(store)) {
        const target = _(RESOURCES_ALL)
          .filter((r) => store.store.getUsedCapacity(r) > 0)
          .sort((r1, r2) => store.store.getUsedCapacity(r1) - store.store.getUsedCapacity(r2))
          .first();

        creep.memory.worked = target && creep.withdraw(store, target, Math.min(store.store.getUsedCapacity(target), creep.store.getFreeCapacity(target)));
        switch (creep.memory.worked) {
          // 空の時
          case ERR_NOT_ENOUGH_RESOURCES:
            creep.memory.storeId = undefined;
            checkMode();
            break;
          // お腹いっぱい
          case ERR_FULL:
            checkMode();
            break;
          // 有りえない系
          case ERR_NOT_IN_RANGE: //先に判定してるのでないはず
          case ERR_NOT_OWNER:
          case ERR_INVALID_TARGET:
          case ERR_INVALID_ARGS:
            console.log(`${creep.name} withdraw returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}:${JSON.stringify(store)}`);
            creep.memory.storeId = undefined;
            creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
            break;

          // 問題ない系
          case OK:
          case ERR_BUSY:
          default:
            creep.memory.storeId = undefined;
            checkMode();
            break;
        }
      }
    }
  }

  if (creep.memory.mode === "🚛") {
    if (!creep.pos.isNearTo(creep.room.storage)) {
      moveMeTo(creep.room.storage, { range: 1 });
    }

    if (creep.pos.isNearTo(creep.room.storage)) {
      const returnVal =
        _(RESOURCES_ALL)
          .map((r) => {
            return creep.room.storage && creep.transfer(creep.room.storage, r);
          })
          .find((ret) => ret !== OK) || OK;
      switch (returnVal) {
        // 手持ちがない
        case ERR_NOT_ENOUGH_RESOURCES: // 値を指定しないから多分発生しない
          checkMode();
          break;

        // 対象が変
        // 有りえない系
        case ERR_INVALID_TARGET: // 対象が変
        case ERR_NOT_IN_RANGE: //先に判定してるのでないはず
        case ERR_NOT_OWNER: // 自creepじゃない
        case ERR_INVALID_ARGS: // 引数が変
          console.log(`${creep.name} transfer returns ${RETURN_CODE_DECODER[returnVal.toString()]}`);
          creep.say(RETURN_CODE_DECODER[returnVal.toString()]);
          break;

        // 問題ない系
        case OK:
        case ERR_BUSY: // spawining
        case ERR_FULL: // 満タン
        default:
          break;
      }
    }
  }
};

export default behavior;

function isGatherer(creep: Creeps): creep is Gatherer {
  return creep.memory.role === "gatherer";
}
