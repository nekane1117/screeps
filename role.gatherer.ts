import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, getSpawnsInRoom, pickUpAll, stealBy } from "./util.creep";
import { findMyStructures, getCapacityRate } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) =>
    customMove(creep, target, {
      ignoreCreeps: !creep.pos.inRangeTo(target, 2),
      ...opt,
    });

  if (!isGatherer(creep)) {
    return console.log(`${creep.name} is not Gatherer`);
  }
  const capacityRate = getCapacityRate(creep);
  // 空っぽになったら収集モードに切り替える
  if (capacityRate < 0.25) {
    changeMode(creep, "🛒");
  }
  // 満タンだったら分配モードに切り替える
  if (capacityRate > 0) {
    changeMode(creep, "💪");
  }

  const spawn = _(getSpawnsInRoom(creep.room)).first();

  if (!spawn) {
    return ERR_NOT_FOUND;
  }
  // https://docs.screeps.com/simultaneous-actions.html

  const { extension, spawn: spawns, link, tower, storage, terminal, container: containers } = findMyStructures(creep.room);

  // 輸送先設定処理###############################################################################################

  // 輸送先が満タンになってたら消す
  if (creep.memory.transferId) {
    const store = Game.getObjectById(creep.memory.transferId);
    if (store && "store" in store && store.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      creep.memory.transferId = undefined;
    }
  }

  if (!creep.memory.transferId) {
    const controllerContaeiner = creep.room.controller?.pos.findClosestByRange(containers);
    creep.memory.transferId = // 空きのあるspawnかextension
      (
        creep.pos.findClosestByRange([...extension, ...spawns], {
          filter: (s: StructureSpawn | StructureExtension) => {
            return s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
          },
        }) ||
        creep.pos.findClosestByRange(tower, {
          filter: (t: StructureTower) => {
            return getCapacityRate(t) <= 0.8;
          },
        }) ||
        (controllerContaeiner && getCapacityRate(controllerContaeiner) < 0.9 ? controllerContaeiner : undefined) ||
        // それか何か入れられるもの
        spawn.pos.findClosestByRange([...link, ...storage, ...terminal, ...containers], {
          filter: (s: StructureSpawn | StructureExtension) => {
            return s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
          },
        })
      )?.id;
  }
  // それでも見つからないとき
  if (!creep.memory.transferId) {
    return moveMeTo(spawn, {
      // 近寄りすぎると邪魔なので
      range: 3,
    });
  }

  // 輸送先を取得
  const transferTarget = Game.getObjectById(creep.memory.transferId);
  if (!transferTarget) {
    // 無いときはなんか変なので初期化して終わる
    creep.memory.transferId = undefined;
    return ERR_NOT_FOUND;
  }

  // 取得元設定処理###############################################################################################

  // 取得元が空になってたら消す
  if (creep.memory.storeId) {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store && "store" in store && store.store.energy === 0) {
      creep.memory.storeId = undefined;
    }
  }

  if (!creep.memory.storeId) {
    const rangeToSpawn = spawn.pos.getRangeTo(transferTarget);
    const filter = (s: StructureSpawn | StructureExtension) => {
      return transferTarget.id !== s.id && s.store.getUsedCapacity(RESOURCE_ENERGY) >= CARRY_CAPACITY && spawn.pos.getRangeTo(s) >= rangeToSpawn;
    };
    // 対象より遠い容量がある入れ物
    creep.memory.storeId = creep.pos.findClosestByRange(_.compact([spawn.pos.findClosestByRange(link), ...storage, ...terminal, ...containers]), {
      filter,
    })?.id;
  }
  // それでも見つからないとき
  if (!creep.memory.storeId) {
    return moveMeTo(spawn, {
      // 近寄りすぎると邪魔なので
      range: 3,
    });
  }

  // 取り出し処理###############################################################################################
  if (creep.memory.mode === "🛒") {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store) {
      if (!creep.pos.isNearTo(store)) {
        moveMeTo(store);
      }

      if (creep.pos.isNearTo(store)) {
        creep.memory.worked = creep.withdraw(store, RESOURCE_ENERGY);
        switch (creep.memory.worked) {
          // 空の時
          case ERR_NOT_ENOUGH_RESOURCES:
            creep.memory.storeId = undefined;
            if (creep.store.energy > CARRY_CAPACITY) {
              changeMode(creep, "💪");
            }
            break;
          // お腹いっぱい
          case ERR_FULL:
            changeMode(creep, "💪");
            break;
          // 有りえない系
          case ERR_NOT_IN_RANGE: //先に判定してるのでないはず
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
            creep.memory.storeId = undefined;
            if (creep.store.energy > 0 && store.store.energy < creep.getActiveBodyparts(CARRY) * CARRY_CAPACITY) {
              changeMode(creep, "💪");
            }
            break;
        }
      }
    }
  }

  if (creep.memory.mode === "💪") {
    const transferTarget = Game.getObjectById(creep.memory.transferId);
    if (transferTarget) {
      if (!creep.pos.isNearTo(transferTarget)) {
        moveMeTo(transferTarget);
      }

      if (creep.pos.isNearTo(transferTarget)) {
        const returnVal = creep.transfer(transferTarget, RESOURCE_ENERGY);
        switch (returnVal) {
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
          case ERR_NOT_IN_RANGE: //先に判定してるのでないはず
          case ERR_NOT_OWNER: // 自creepじゃない
          case ERR_INVALID_ARGS: // 引数が変
            console.log(`${creep.name} transfer returns ${RETURN_CODE_DECODER[returnVal.toString()]}`);
            creep.say(RETURN_CODE_DECODER[returnVal.toString()]);
            break;

          // 問題ない系
          case OK:
          case ERR_BUSY: // spawining
          default:
            if (getCapacityRate(transferTarget) > 0.9) {
              creep.memory.transferId = undefined;
            }
            break;
        }
      }
    }
  }

  // 通りがかりに奪い取る
  stealBy(creep, ["harvester", "distributer"]);

  // 落っこちてるものを拾う
  pickUpAll(creep);
};

export default behavior;

function isGatherer(creep: Creeps): creep is Gatherer {
  return creep.memory.role === "gatherer";
}

function changeMode(creep: Gatherer, mode: GathererMemory["mode"]) {
  if (creep.memory.mode !== mode) {
    creep.say(mode);
    creep.memory.mode = mode;
    if (mode === "🛒") {
      creep.memory.storeId = undefined;
    }
    creep.memory.transferId = undefined;
  }
}
