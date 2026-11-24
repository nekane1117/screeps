import { findMyStructures, getLabs, getSitesInRoom } from "../utils";
import { RETURN_CODE_DECODER, customMove, getCreepsInRoom, getMainSpawn, pickUpAll } from "../utils/creep";

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

  const { source } = findMyStructures(creep.room);
  const mainSpawn = getMainSpawn(creep.room);

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

  if ((creep.room.controller && creep.room.controller?.ticksToDowngrade < 200000) || getSitesInRoom(creep.room).length === 0) {
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
  } else {
    creep.memory.worked = undefined;
  }

  // withdraw
  const store = findStore(creep);
  // 取得したstoreのidを保存
  creep.memory.storeId = store?.id;
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
    // withdraw
    // 落っこちてるものを拾う
    pickUpAll(creep);
  } else if (store === undefined) {
    // 空なので余剰
    creep.say("EMPTY");
    const { upgrader = [] } = getCreepsInRoom(creep.room);
    const workLimit = source.length * 10;
    let works = 0;
    // 余剰なupgrader
    const excessiveUpgrader = _(upgrader)
      .sortBy((u) => -(u.ticksToLive || Infinity))
      .filter((u) => {
        // エネルギー切れかつworkの上限workの合計が上限以上は余剰
        // 端数分は生きててほしいので判定してから足しこむ
        const result = u.store.energy === 0 && works >= workLimit;
        works += u.getActiveBodyparts(WORK);
        return result;
      });
    // 余剰なupgraderを捨てる
    if (excessiveUpgrader.include(creep)) {
      if (mainSpawn) {
        if (creep.pos.isNearTo(mainSpawn)) {
          mainSpawn.recycleCreep(creep);
        } else {
          moveMeTo(mainSpawn);
        }
      }
    }
  } else {
    // そう毎度起こるはずじゃないので手当たり次第に建築する
    const site = (creep.room.controller || creep).pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
    if (site) {
      creep.build(site);
    }
  }
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

/**
 * 取得先を探す処理  
 * - 正しいときはそのまま返す
 * - 無いか空だと探す(コントローラー(一応フォールバックで自分)を起点に３マス以内)
 * - 周囲にコンテナが存在しないときはnull
 * - 存在するが空の時はundefined
 */
function findStore(u: Upgrader) {
  const { container = [], link: links = [] } = findMyStructures(u.room);
  const memory: Readonly<UpgraderMemory> = u.memory;

  // いったん指定のものを見る
  const storage = memory.storeId && Game.getObjectById(memory.storeId);

  // まだ中身があるならそれで
  if ((storage?.store.energy || 0) > CARRY_CAPACITY) {
    return storage;
  }

  // 書き換えが要るとき

  // そもそも存在するか(コントローラーから射程３以内)
  const exists = [...links, ...container].filter((c) => c.pos.inRangeTo((u.room.controller || u).pos, 3));
  if (exists.length > 0) {
    // 存在はするが中身はあるか
    const filled = exists.filter((c) => c.store.energy > CARRY_CAPACITY);
    if (filled.length > 0) {
      // リンクを優先的に取る
      return _(filled)
        .sortBy((c) => {
          switch (c.structureType) {
            case "link":
              return 0;

            default:
              return 1;
          }
        })
        .first();
    } else {
      // 空のときはundefinedを返す
      return undefined;
    }
  } else {
    // そもそもないときはnullを返す
    return null;
  }
}
