import { RETURN_CODE_DECODER } from "./constants";
import { cond, noop, shallowEq, someOf, stubTrue } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isCarrier(creep)) {
    return console.log(`${creep.name} is not Harvester`);
  }

  // https://docs.screeps.com/simultaneous-actions.html

  if (creep.memory.mode === "collecting") {
    const store = Game.getObjectById(creep.memory.storeId);
    if (!store) {
      return creep.suicide();
    }

    // withdraw
    // 隣にいなければ寄る
    if (!creep.pos.isNearTo(store)) {
      creep.moveTo(store, {
        ignoreCreeps: creep.pos.getRangeTo(store) > 3,
        plainCost: 2,
      });
    }

    /**
     * 隣にいるときは取得する(寄った後取れるかもしれないのでmoveToと排他ではない)
     * 距離も再取得する
     */
    if (creep.pos.isNearTo(store)) {
      cond<ScreepsReturnCode>(
        // 満タン
        [
          shallowEq<ScreepsReturnCode>(ERR_FULL),
          () => {
            // 作業モードに切り替える
            changeMode(creep, "working");
          },
        ],
        // 有りえない系
        [
          someOf<ScreepsReturnCode>(ERR_NOT_OWNER, ERR_INVALID_TARGET, ERR_NOT_IN_RANGE, ERR_INVALID_ARGS),
          (value: ScreepsReturnCode) => {
            console.log(`${creep.name} withdraw return ${RETURN_CODE_DECODER[value.toString()]}`);
            creep.say(RETURN_CODE_DECODER[value.toString()]);
          },
        ],
        // 問題ない系は何もしない
        [stubTrue<ScreepsReturnCode>(), noop],
      )(creep.withdraw(store, RESOURCE_ENERGY));
    }
  } else {
    // transfer

    // 対象設定処理
    if (!creep.memory.transferId) {
      // Structureを取得する
      const {
        container = [],
        extension = [],
        spawn = [],
        storage = [],
        link = [],
        tower = [],
      } = creep.room
        .find(FIND_STRUCTURES, {
          filter: (s) => {
            // 自分の倉庫以外で空いてるStructure
            return s.id !== creep.memory.storeId && "store" in s && s.store.getFreeCapacity(RESOURCE_ENERGY) / s.store.getCapacity(RESOURCE_ENERGY) < 0.8;
          },
        })
        .reduce(
          (structures, s) => {
            return {
              ...structures,
              [s.structureType]: (structures[s.structureType] || []).concat(s),
            };
          },
          {} as Partial<Record<StructureConstant, Structure[]>>,
        );
      // 優先度順に検索してセットする
      creep.memory.transferId =
        creep.pos.findClosestByRange([...container, ...extension, ...spawn, ...storage, ...link])?.id || creep.pos.findClosestByRange([...tower])?.id;
      // それでもなければどうしようもないので終わる
      if (!creep.memory.transferId) {
        return ERR_NOT_FOUND;
      }
    }

    const transferTarget = Game.getObjectById(creep.memory.transferId);
    if (!transferTarget) {
      creep.memory.transferId = null;
      return ERR_NOT_FOUND;
    }
    // 隣にいなければ寄る
    if (!creep.pos.isNearTo(transferTarget)) {
      creep.moveTo(transferTarget, {
        ignoreCreeps: creep.pos.getRangeTo(transferTarget) > 3,
        plainCost: 2,
      });
    }

    /**
     * 隣にいるときは取得する(寄った後取れるかもしれないのでmoveToと排他ではない)
     * 距離も再取得する
     */
    if (creep.pos.isNearTo(transferTarget)) {
      cond<ScreepsReturnCode>(
        // 満タン
        [
          shallowEq<ScreepsReturnCode>(ERR_FULL),
          () => {
            // 渡して満タンの時は新しい輸送先を探す
            creep.memory.transferId = undefined;
          },
        ],
        // 空っぽ
        [
          shallowEq<ScreepsReturnCode>(ERR_NOT_ENOUGH_RESOURCES),
          () => {
            // 収集モードに切り替える
            changeMode(creep, "collecting");
          },
        ],
        // 有りえない系
        [
          someOf<ScreepsReturnCode>(ERR_NOT_OWNER, ERR_INVALID_TARGET, ERR_INVALID_ARGS),
          (value: ScreepsReturnCode) => {
            console.log(`${creep.name} withdraw return ${RETURN_CODE_DECODER[value.toString()]}`);
            creep.say(RETURN_CODE_DECODER[value.toString()]);
          },
        ],
        // 問題ない系は何もしない
        [stubTrue<ScreepsReturnCode>(), noop],
      )(creep.transfer(transferTarget, RESOURCE_ENERGY));
    }
  }
};

export default behavior;

function isCarrier(creep: Creeps): creep is Carrier {
  return creep.memory.role === "carrier";
}

function changeMode(creep: Carrier, mode: CarrierMemory["mode"]) {
  if (creep.memory.mode !== mode) {
    creep.say(mode);
    creep.memory.mode = mode;
    creep.memory.transferId = undefined;
  }
}
