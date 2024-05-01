import { RETURN_CODE_DECODER } from "./constants";
import { cond, noop, shallowEq, someOf, stubTrue } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isUpgrader(creep)) {
    console.log(`${creep.name} is not upgrader`);
    return ERR_INVALID_TARGET;
  }

  if (!creep.room.controller) {
    return creep.suicide();
  }
  if (creep.memory.mode === "working") {
    const range = creep.pos.getRangeTo(creep.room.controller);
    if (range <= 3) {
      return creep.upgradeController(creep.room.controller);
    } else {
      creep.moveTo(creep.room.controller, {
        // 近場までは同じ道を進む
        ignoreCreeps: range > 6,
        // 道を優先
        plainCost: 2,
      });
    }
  } else {
    if (!creep.memory.storeId) {
      // 中身のあるストレージを取得する
      const { container, extension, link, spawn, storage } = _(
        creep.room.find(FIND_STRUCTURES, {
          filter: (s): s is StoreTarget => "store" in s && s.store.getUsedCapacity(RESOURCE_ENERGY) > 0,
        }),
      ).reduce(
        (mapper, s) => {
          return {
            ...mapper,
            [s.structureType]: (mapper[s.structureType] || []).concat(s),
          };
        },
        {
          container: [],
          extension: [],
          link: [],
          spawn: [],
          storage: [],
        } as Record<StoreTarget["structureType"], StoreTarget[]>,
      );
      // 優先度順で検索して設定する
      creep.memory.storeId =
        creep.room.controller.pos.findClosestByRange([...container, ...storage, ...link])?.id ||
        creep.room.controller.pos.findClosestByRange([...extension, ...spawn])?.id;
      if (!creep.memory.storeId) {
        // それでもなければ終わる
        return ERR_NOT_FOUND;
      }
    }

    const store = Game.getObjectById(creep.memory.storeId);

    if (store) {
      const nearTo = creep.pos.isNearTo(store);
      // 隣にいないときは移動
      if (!nearTo) {
        creep.moveTo(store, {
          ignoreCreeps: creep.pos.getRangeTo(store) > 3,
          plainCost: 2,
        });
      }
      // 隣にいるときは取得(移動後なので移動と排他ではない)
      if (creep.pos.isNearTo(store)) {
        cond<ScreepsReturnCode>(
          // 空っぽ
          [
            shallowEq<ScreepsReturnCode>(ERR_NOT_ENOUGH_RESOURCES),
            () => {
              // 行き先のをクリアしておく
              creep.memory.storeId = undefined;
            },
          ],
          // 満タン
          [
            shallowEq<ScreepsReturnCode>(ERR_FULL),
            () => {
              // 行き先のをクリアして作業モードに
              creep.memory.storeId = undefined;
              creep.memory.mode = "working";
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
          // 問題ない系
          [stubTrue<ScreepsReturnCode>(), noop],
        )(creep.withdraw(store, RESOURCE_ENERGY));
      }
    } else {
      // 見つからなかったら一旦クリアしておく
      creep.memory.storeId = undefined;
      return creep.say("no store");
    }
  }
};

export default behavior;

function isUpgrader(c: Creeps): c is Upgrader {
  return "role" in c.memory && c.memory.role === "upgrader";
}
