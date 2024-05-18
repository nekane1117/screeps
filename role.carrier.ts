import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, getCreepsInRoom, getMainSpawn, pickUpAll, withdrawBy } from "./util.creep";
import { findMyStructures, getCapacityRate } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) =>
    customMove(creep, target, {
      ignoreCreeps: !creep.pos.inRangeTo(target, 2),
      ...opt,
    });

  if (!isCarrier(creep)) {
    return console.log(`${creep.name} is not Carrier`);
  }

  function checkMode() {
    if (!isCarrier(creep)) {
      return console.log(`${creep.name} is not Carrier`);
    }
    const newMode = creep.store.energy < CARRY_CAPACITY ? "🛒" : "💪";

    if (creep.memory.mode !== newMode) {
      creep.say(newMode);
      creep.memory.mode = newMode;
      if (newMode === "🛒") {
        creep.memory.storeId = undefined;
      }
      creep.memory.transferId = undefined;
    }
  }
  checkMode();
  const spawn = getMainSpawn(creep.room);

  if (!spawn) {
    return ERR_NOT_FOUND;
  }
  // https://docs.screeps.com/simultaneous-actions.html

  const { extension, spawn: spawns, link, tower, storage, terminal, container: containers } = findMyStructures(creep.room);
  const controllerContaeiner = creep.room.controller?.pos.findClosestByRange(containers);

  // 輸送先設定処理###############################################################################################

  // 輸送先が満タンになってたら消す
  if (creep.memory.transferId) {
    const store = Game.getObjectById(creep.memory.transferId);
    if (store && "store" in store && store.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      creep.memory.transferId = undefined;
    }
  }

  // 他のcarrierに設定されていない
  const exclusive = ({ id }: _HasId) =>
    getCreepsInRoom(creep.room)
      .filter((c): c is Carrier => c.memory.role === "carrier")
      .every((g) => g.memory.transferId !== id);

  if (!creep.memory.transferId) {
    creep.memory.transferId = creep.pos.findClosestByRange([...extension, ...spawns], {
      filter: (s: StructureSpawn | StructureExtension) => {
        return s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && exclusive(s);
      },
    })?.id;
  }

  if (!creep.memory.transferId) {
    creep.memory.transferId = storage.find((s) => s.store.energy < s.room.energyCapacityAvailable)?.id;
  }

  if (!creep.memory.transferId) {
    creep.memory.transferId = creep.pos.findClosestByRange(tower, {
      filter: (t: StructureTower) => {
        return getCapacityRate(t) < 1 && exclusive(t);
      },
    })?.id;
  }

  if (!creep.memory.transferId) {
    creep.memory.transferId = (controllerContaeiner && getCapacityRate(controllerContaeiner) < 0.9 ? controllerContaeiner : undefined)?.id;
  }

  if (!creep.memory.transferId) {
    creep.memory.transferId = spawn.pos.findClosestByRange([...link, ...storage, ...terminal, ...containers], {
      filter: (s: StructureSpawn | StructureExtension) => {
        return s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
      },
    })?.id;
  }
  // それでも見つからないとき
  if (!creep.memory.transferId) {
    return ERR_NOT_FOUND;
  }

  // 輸送先を取得
  const transferTarget = Game.getObjectById(creep.memory.transferId);
  if (!transferTarget) {
    // 無いときはなんか変なので初期化して終わる
    creep.memory.transferId = undefined;
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
    // つっかえちゃうので取り出しようlinkは優先的に取り出す
    creep.memory.storeId = (
      (() => {
        const extructor = spawn.pos.findClosestByRange(link);
        return extructor && extructor.store.energy >= CARRY_CAPACITY ? extructor : undefined;
      })() ||
      creep.pos.findClosestByRange(_.compact([...storage, ...terminal, ...containers]), {
        filter: (s: StructureSpawn | StructureExtension | StructureContainer) => {
          return controllerContaeiner?.id !== s.id && transferTarget?.id !== s.id && s.store.energy >= CARRY_CAPACITY;
        },
      })
    )?.id;
  }
  // 取り出し処理###############################################################################################
  if (creep.memory.storeId && creep.memory.mode === "🛒") {
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
            console.log(`${creep.name} transfer returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
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

  if (creep.memory.transferId && creep.memory.mode === "💪") {
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
            checkMode();
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
  withdrawBy(creep, ["harvester"]);

  // 落っこちてるものを拾う
  pickUpAll(creep);
};

export default behavior;

function isCarrier(creep: Creeps): creep is Carrier {
  return creep.memory.role === "carrier";
}
