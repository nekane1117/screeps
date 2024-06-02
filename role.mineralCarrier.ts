import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, pickUpAll, withdrawBy } from "./util.creep";
import { getCapacityRate } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) =>
    customMove(creep, target, {
      ignoreCreeps: !creep.pos.inRangeTo(target, 2),
      ...opt,
    });

  if (!isMc(creep)) {
    return console.log(`${creep.name} is not MineralCarrier`);
  }

  const mineral = creep.room.find(FIND_MINERALS)[0];
  function checkMode() {
    if (!isMc(creep)) {
      return console.log(`${creep.name} is not MineralCarrier`);
    }
    const newMode = ((c: MineralCarrier) => {
      if (c.memory.mode === "🚛" && creep.store.getUsedCapacity() === 0) {
        // 作業モードで空になったら収集モードにする
        return "🛒";
      }

      if (c.memory.mode === "🛒" && creep.store.getUsedCapacity() > CARRY_CAPACITY) {
        // 収集モードで50超えたら作業モードにする
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
      creep.memory.transferId = undefined;
      // 運搬モードに切り替えたときの容量を記憶する
      if (newMode === "🚛") {
        creep.room.memory.carrySize.mineralCarrier = (creep.room.memory.carrySize.mineralCarrier * 100 + creep.store[mineral.mineralType]) / 101;
      }
    }
  }
  checkMode();
  if (!mineral) {
    return creep.suicide();
  }
  // https://docs.screeps.com/simultaneous-actions.html

  // 取得元設定処理###############################################################################################

  // 取得元が空になってたら消す
  if (creep.memory.storeId) {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store && "store" in store && store.store.energy === 0) {
      creep.memory.storeId = undefined;
    }
  }

  if (!creep.memory.storeId) {
    creep.memory.storeId = mineral.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (s): s is StructureContainer => {
        return s.structureType === STRUCTURE_CONTAINER && s.store[mineral.mineralType] > CARRY_CAPACITY;
      },
    })?.id;
  }
  // 取り出し処理###############################################################################################
  if (creep.memory.storeId && creep.memory.mode === "🛒") {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store) {
      if (!creep.pos.isNearTo(store)) {
        moveMeTo(store);
      }

      if (creep.pos.isNearTo(store)) {
        creep.memory.worked = creep.withdraw(store, mineral.mineralType);
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
            console.log(`${creep.name} withdraw returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
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

  // 輸送先設定処理###############################################################################################

  // 輸送先が満タンになってたら消す
  if (creep.memory.transferId) {
    const store = Game.getObjectById(creep.memory.transferId);
    if (store && "store" in store && store.store.getFreeCapacity(mineral.mineralType) === 0) {
      creep.memory.transferId = undefined;
    }
  }

  //lab
  if (!creep.memory.transferId) {
    creep.memory.transferId = creep.room.terminal?.id;
  }

  // それでも見つからないとき
  if (!creep.memory.transferId) {
    return ERR_NOT_FOUND;
  }

  if (creep.memory.transferId && creep.memory.mode === "🚛") {
    const transferTarget = Game.getObjectById(creep.memory.transferId);
    if (transferTarget) {
      if (!creep.pos.isNearTo(transferTarget)) {
        moveMeTo(transferTarget);
      }

      if (creep.pos.isNearTo(transferTarget)) {
        (Object.keys(creep.store) as ResourceConstant[]).forEach((type) => {
          const returnVal = creep.transfer(transferTarget, type);
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
        });
      }
    }
  }

  // 通りがかりに奪い取る
  withdrawBy(creep, ["mineralHarvester"], mineral.mineralType);

  // 落っこちてるものを拾う
  pickUpAll(creep, mineral.mineralType);
};

export default behavior;

function isMc(creep: Creeps): creep is MineralCarrier {
  return creep.memory.role === "mineralCarrier";
}
