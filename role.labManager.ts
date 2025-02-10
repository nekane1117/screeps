import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, pickUpAll } from "./util.creep";
import { findMyStructures, getLabs, isCompound } from "./utils";

const TRANSFER_THRESHOLD = 1000;

const behavior: CreepBehavior = (creep: Creeps) => {
  const { room } = creep;
  const terminal = room.terminal;

  if (!terminal) {
    // ターミナルがないことは無いはず
    return ERR_NOT_FOUND;
  }

  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) =>
    customMove(creep, target, {
      swampCost: 1,
      plainCost: 1,
      ...opt,
    });

  if (!isLabManager(creep)) {
    return console.log(`${creep.name} is not LabManager`);
  }

  function checkMode() {
    if (!isLabManager(creep)) {
      return console.log(`${creep.name} is not LabManager`);
    }
    const newMode = creep.store.getUsedCapacity() === 0 ? "🛒" : "🚛";

    if (creep.memory.mode !== newMode) {
      creep.say(newMode);
      creep.memory.mode = newMode;
      if (newMode === "🛒") {
        creep.memory.storeId = undefined;
        creep.memory.mineralType = undefined;
      }
      creep.memory.transferId = undefined;
      // 運搬モードに切り替えたときの容量を記憶する
      if (newMode === "🚛") {
        (creep.room.memory.carrySize = creep.room.memory.carrySize || {}).labManager =
          ((creep.room.memory.carrySize?.labManager || 100) * 100 + creep.store.getUsedCapacity()) / 101;
      }
    }
  }
  checkMode();
  // https://docs.screeps.com/simultaneous-actions.html

  const { factory } = findMyStructures(creep.room);

  const labs = _([factory && Object.assign(factory, factory && { memory: Memory.factories[factory.id] }), ...getLabs(room).value()]).compact();

  // 取得元設定処理###############################################################################################

  // 取得元が空になってたら消す
  if (creep.memory.storeId) {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store && "store" in store && store.store.energy < CARRY_CAPACITY) {
      creep.memory.storeId = undefined;
    }
  }

  // ラボの情報を整理する
  const { wrong, requesting, completed } = labs
    .sortBy((l) => {
      return l.memory.expectedType;
    })
    .reduce(
      (mapping, structure) => {
        if (structure.structureType === STRUCTURE_FACTORY) {
          if (structure.memory.outputType) {
            mapping.completed.push(structure);
          }
          if (structure.memory.expectedType) {
            mapping.requesting.push(structure);
          }
        } else {
          if (structure.mineralType) {
            if (structure.mineralType !== structure.memory.expectedType) {
              // 期待値と異なる
              mapping.wrong.push(structure);
            } else if (isCompound(structure.mineralType)) {
              // 化合物の時

              if (structure.store[structure.mineralType] > TRANSFER_THRESHOLD * 2) {
                // 完成
                mapping.completed.push(structure);
              } else if (structure.store[structure.mineralType] <= TRANSFER_THRESHOLD) {
                // ターミナルにあってたらなくなってきたときは要求する
                mapping.requesting.push(structure);
              } else {
                // 処理中のはず
                mapping.noProblem.push(structure);
              }
            } else {
              // 原料の時
              if (structure.store.getFreeCapacity(structure.mineralType) > 1000) {
                // 空きがあるときは要求中
                mapping.requesting.push(structure);
              } else {
                // 処理待ち
                mapping.noProblem.push(structure);
              }
            }
          } else {
            if (structure.memory.expectedType.length >= 2) {
              // 化合物待ち中は正しい
              mapping.noProblem.push(structure);
            } else {
              // 原料待ち中は要求中
              mapping.requesting.push(structure);
            }
          }
        }

        return mapping;
      },
      {
        completed: [],
        noProblem: [],
        requesting: [],
        wrong: [],
      } as Record<
        "wrong" | "completed" | "requesting" | "noProblem",
        ((StructureLab & { memory: LabMemory }) | (StructureFactory & { memory: FactoryMemory }))[]
      >,
    );

  // 正しくないやつは整理する
  if (!creep.memory.storeId && wrong.length > 0) {
    creep.memory.storeId = _(wrong).first()?.id;
  }

  // 出来てるやつを取りに行く
  if (!creep.memory.storeId) {
    creep.memory.storeId = _(completed).first()?.id;
  }

  // 要求に応じてターミナルに取りに行く
  if (!creep.memory.storeId) {
    const { factory } = findMyStructures(creep.room);
    const storages = _.compact([creep.room.terminal, factory, creep.room.storage]);

    for (const req of requesting) {
      const s = _(storages)
        .filter((s) => s.store.getUsedCapacity(req.memory.expectedType) > 0)
        .max((s) => s.store.getUsedCapacity(req.memory.expectedType));
      if (s) {
        creep.memory.storeId = s?.id;
        creep.memory.mineralType = req.memory.expectedType;
      }
    }
  }

  // 落っこちてるものを拾う
  if (creep.memory.mineralType && pickUpAll(creep, creep.memory.mineralType) === OK) {
    return;
  }

  // 取り出し処理###############################################################################################
  if (creep.memory.storeId && creep.memory.mode === "🛒") {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store) {
      if (!creep.pos.isNearTo(store)) {
        moveMeTo(store);
      }

      if (creep.pos.isNearTo(store)) {
        creep.memory.worked = ((creep: LabManager) => {
          // ターミナルの時
          if (store.structureType === STRUCTURE_TERMINAL || store.structureType === STRUCTURE_STORAGE) {
            // 原料の指定があるとき
            if (creep.memory.mineralType) {
              // 取り出す
              return creep.withdraw(store, creep.memory.mineralType);
            } else {
              // 無いときはおかしいので初期化してエラーを返す
              creep.memory.storeId = undefined;
              creep.memory.mineralType = undefined;
              return ERR_INVALID_ARGS;
            }
          } else if (store.structureType === STRUCTURE_FACTORY) {
            const memory = Memory.factories[store.id];
            if (memory.outputType) {
              // 取り出す
              return creep.withdraw(
                store,
                memory.outputType,
                Math.min(creep.store.getCapacity(memory.outputType), Math.max(0, store.store[memory.outputType] - TRANSFER_THRESHOLD * 2)),
              );
            } else {
              // 無いときはおかしいので初期化してエラーを返す
              creep.memory.storeId = undefined;
              creep.memory.mineralType = undefined;
              return ERR_INVALID_ARGS;
            }
          } else {
            // LABの時
            if (store.mineralType) {
              // 取り出す
              return creep.withdraw(store, store.mineralType, Math.min(creep.store.getCapacity(store.mineralType), store.store[store.mineralType]));
            } else {
              // 無いときはおかしいので初期化してエラーを返す
              creep.memory.storeId = undefined;
              creep.memory.mineralType = undefined;
              return ERR_INVALID_ARGS;
            }
          }
        })(creep);
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

  // #region 輸送先設定処理###############################################################################################

  const currentType = Object.entries(creep.store).find(([_type, amount]) => amount)?.[0] as MineralConstant | MineralCompoundConstant | undefined;
  // 輸送先が満タンになってたら消す
  if (creep.memory.transferId) {
    const store = Game.getObjectById(creep.memory.transferId);
    if (store && "store" in store && store.store.getFreeCapacity(currentType) === 0) {
      creep.memory.transferId = undefined;
    }
  }
  if (!creep.memory.transferId) {
    // 今持ってるタイプ
    if (!currentType) {
      return ERR_NOT_ENOUGH_RESOURCES;
    }

    // 原料の時はリクエストしてるLABがあれば持っていく
    if (!creep.memory.transferId) {
      creep.memory.transferId = requesting.find((lab) => lab.memory.expectedType === currentType)?.id;
    }

    // 化合物(完成品) or リクエストが見つからなかった原料はターミナルにしまっておく
    if (!creep.memory.transferId) {
      creep.memory.transferId = _([terminal, creep.room.storage, factory]).min((s) => s?.store.getUsedCapacity(currentType))?.id;
    }
  }

  //#endregion###############################################################################################
  //#region 輸送処理###############################################################################################
  if (creep.memory.transferId && creep.memory.mode === "🚛") {
    const transferTarget = Game.getObjectById(creep.memory.transferId);
    if (transferTarget) {
      if (!creep.pos.isNearTo(transferTarget)) {
        moveMeTo(transferTarget);
      }

      if (creep.pos.isNearTo(transferTarget)) {
        (Object.keys(creep.store) as ResourceConstant[]).map((resourceType) => {
          const returnVal = creep.transfer(transferTarget, resourceType);
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
              console.log(`${creep.name} transfer ${resourceType} returns ${RETURN_CODE_DECODER[returnVal.toString()]}`);
              creep.say(RETURN_CODE_DECODER[returnVal.toString()].replace("ERR_", ""));
              break;

            // 問題ない系
            case OK:
            case ERR_BUSY: // spawining
            default:
              break;
          }
        });
      }
    } else {
      creep.memory.transferId = undefined;
    }
  }
  //#endregion###############################################################################################
};

export default behavior;

function isLabManager(creep: Creeps): creep is LabManager {
  return creep.memory.role === "labManager";
}
