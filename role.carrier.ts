import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, getSpawnNamesInRoom, isStoreTarget, pickUpAll, stealBy } from "./util.creep";
import { getCapacityRate } from "./utils";
import { defaultTo } from "./utils.common";

type Structures<T extends StructureConstant = StructureConstant> = {
  [t in T]: Structure<T>[];
};
const behavior: CreepBehavior = (creep: Creeps) => {
  const moveMeTo = (target: RoomPosition | _HasRoomPosition) =>
    customMove(creep, target, {
      ignoreCreeps: !creep.pos.inRangeTo(target, 2),
      visualizePathStyle: { stroke: "#00ffff" },
    });

  if (!isCarrier(creep)) {
    return console.log(`${creep.name} is not Harvester`);
  }
  // 空っぽになったら収集モードに切り替える
  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    changeMode(creep, "🛒");
  }
  // 満タンだったら分配モードに切り替える
  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    changeMode(creep, "💪");
  }

  const spawn = creep.pos.findClosestByRange(
    _(getSpawnNamesInRoom(creep.room))
      .map((name) => Game.spawns[name])
      .compact()
      .run(),
  );

  // https://docs.screeps.com/simultaneous-actions.html

  // withdraw
  const store = Game.getObjectById(creep.memory.storeId);
  if (store && spawn) {
    // 取得しようとしてみる
    creep.memory.worked = creep.withdraw(store, RESOURCE_ENERGY);
    switch (creep.memory.worked) {
      // 空の時
      case ERR_NOT_ENOUGH_RESOURCES:
        // 邪魔になるときがあるのでうろうろしておく
        if (creep.store.energy > 0 && store.store.energy === 0) {
          changeMode(creep, "💪");
        }
        break;
      // お腹いっぱい
      case ERR_FULL:
        changeMode(creep, "💪");
        break;
      case ERR_NOT_IN_RANGE:
        if (creep.memory.mode === "🛒") {
          moveMeTo(store);
        }
        break;

      // 有りえない系
      case ERR_NOT_OWNER:
      case ERR_INVALID_TARGET:
      case ERR_INVALID_ARGS:
        console.log(`${creep.name} transfer returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
        creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
        break;

      // 問題ない系
      case OK:
      case ERR_BUSY:
      default:
        if (creep.store.energy > 0 && store.store.energy < creep.store.getCapacity(RESOURCE_ENERGY)) {
          changeMode(creep, "💪");
        }
        break;
    }
  } else {
    // Storeが見つからなければ処分
    return creep.suicide();
  }

  // transfer
  if (!creep.memory.transferId) {
    // 最寄りのspawnまでの距離(見つからないときは0にして適当にごまかしている)
    const rangeToClosestSpawn = store.pos.findClosestByRange(getSpawnNamesInRoom(store.room).map((name) => Game.spawns[name]))?.pos.getRangeTo(store) || 0;
    // 対象設定処理
    const {
      spawn: spawns = [],
      container = [],
      extension = [],
      link = [],
      tower = [],
    } = creep.room
      .find(FIND_STRUCTURES, {
        filter: (s): s is StructureSpawn | StructureTower | StructureExtension | StructureLink | StructureContainer => {
          // 自分の倉庫は無視
          // storeを持ってない
          if (s.id === creep.memory.storeId || !("store" in s)) {
            return false;
          }

          const storeRate = getCapacityRate(s, RESOURCE_ENERGY);
          // 満タンのものは無視
          if (storeRate > 0.9) {
            return false;
          }

          // タイプごとの判定
          switch (s.structureType) {
            case STRUCTURE_TOWER:
            case STRUCTURE_EXTENSION:
            case STRUCTURE_SPAWN:
              return true;
            case STRUCTURE_CONTAINER:
            case STRUCTURE_LINK:
              return s.pos.inRangeTo(creep, rangeToClosestSpawn);

            default:
              return false;
          }
        },
      })
      .reduce(
        (storages, s) => {
          return {
            ...storages,
            [s.structureType]: defaultTo(storages[s.structureType], []).concat(s),
          };
        },
        {} as Structures<STRUCTURE_SPAWN | STRUCTURE_TOWER | STRUCTURE_EXTENSION | STRUCTURE_LINK | STRUCTURE_CONTAINER>,
      );

    // 優先順に検索をかける
    // Link
    if (!creep.memory.transferId) {
      creep.memory.transferId = creep.pos.findClosestByRange(link)?.id;
    }
    // Spawnとか
    if (!creep.memory.transferId) {
      creep.memory.transferId = creep.pos.findClosestByRange(
        _([...spawns, ...container, ...extension])
          .compact()
          .run(),
      )?.id;
    }
    // upgrade用のコンテナ
    if (!creep.memory.transferId && creep.room.controller) {
      // コントローラに一番近いコンテナ
      const store = creep.room.controller.pos.findClosestByRange(FIND_STRUCTURES, { filter: isStoreTarget });
      // 容量があるとき
      if (store && store.id !== creep.memory.storeId && store.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        creep.memory.transferId = store.id;
      }
    }
    // tower
    if (!creep.memory.transferId) {
      creep.memory.transferId = creep.pos.findClosestByRange(tower)?.id;
    }
    // 入れ物何でも
    if (!creep.memory.transferId) {
      creep.memory.transferId = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (s) => {
          return s.id !== creep.memory.storeId && "store" in s && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        },
      })?.id;
    }
    if (!creep.memory.transferId) {
      // 完全に見つからなければうろうろしておく
      return ERR_NOT_FOUND;
    }
  }

  const transferTarget = Game.getObjectById(creep.memory.transferId);
  if (!transferTarget || getCapacityRate(transferTarget) === 1) {
    creep.memory.transferId = undefined;
    // 完全に見つからなければうろうろしておく
    return ERR_NOT_FOUND;
  }

  const returnVal = creep.transfer(transferTarget, RESOURCE_ENERGY);
  switch (returnVal) {
    // 遠い
    case ERR_NOT_IN_RANGE:
      // 分配モードの時は倉庫に近寄る
      if (creep.memory.mode === "💪") {
        moveMeTo(transferTarget);
      }
      break;

    // 手持ちがない
    case ERR_NOT_ENOUGH_RESOURCES: // 値を指定しないから多分発生しない
      changeMode(creep, "🛒");
      break;

    // 対象が変
    case ERR_INVALID_TARGET: // 対象が変
    case ERR_FULL: // 満タン
      creep.memory.transferId = undefined;
      break;

    // 有りえない系
    case ERR_NOT_OWNER: // 自creepじゃない
    case ERR_INVALID_ARGS: // 引数が変
      console.log(`${creep.name} transfer returns ${RETURN_CODE_DECODER[returnVal.toString()]}`);
      creep.say(RETURN_CODE_DECODER[returnVal.toString()]);
      break;

    // 問題ない系
    case OK:
      creep.pos.findInRange(FIND_STRUCTURES, 1, { filter: isStoreTarget }).map((s) => creep.transfer(s, RESOURCE_ENERGY));
      break;
    case ERR_BUSY: // spawining
    default:
      break;
  }

  // 通りがかりに奪い取る
  stealBy(creep, ["harvester"]);

  // 落っこちてるものを拾う
  pickUpAll(creep);
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
