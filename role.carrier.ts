import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, getMainSpawn, pickUpAll, withdrawBy } from "./util.creep";
import { findMyStructures, getCapacityRate } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  const { room } = creep;

  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) => {
    customMove(creep, target, {
      plainCost: 2,
      swampCost: 5,
      ignoreCreeps: true,
      ...opt,
    });
  };
  if (!isCarrier(creep)) {
    return console.log(`${creep.name} is not Carrier`);
  }

  function checkMode() {
    if (!isCarrier(creep)) {
      return console.log(`${creep.name} is not Carrier`);
    }
    const newMode = ((c: Carrier) => {
      if (c.memory.mode === "🚛" && creep.store.energy === 0) {
        // 作業モードで空になったら収集モードにする
        return "🛒";
      }

      if (
        c.memory.mode === "🛒" &&
        creep.store.energy >=
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
      // モードが変わったら取得先・輸送先をリセットする
      if (newMode === "🛒") {
        creep.memory.storeId = undefined;
      }
      creep.memory.transferId = undefined;

      // 運搬モードに切り替えたときの容量を記憶する
      if (newMode === "🚛") {
        (creep.room.memory.carrySize = creep.room.memory.carrySize || {}).carrier =
          ((creep.room.memory.carrySize?.carrier || 100) * 100 + creep.store.energy) / 101;
      }
    }
  }
  checkMode();
  const center = room.storage || getMainSpawn(room);
  if (!center) {
    return creep.say("center not found");
  }
  // https://docs.screeps.com/simultaneous-actions.html

  //#region 取得元設定処理###############################################################################################

  // 取得元が空になってたら消す
  if (creep.memory.storeId) {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store && "store" in store && store.store.energy < CARRY_CAPACITY) {
      creep.memory.storeId = undefined;
    }
  }

  // 取り出していいやつら
  const { link, container, storage, terminal, factory } = findMyStructures(room);

  // つっかえるので中央のリンクは最優先
  if (!creep.memory.storeId) {
    creep.memory.storeId = link.find((l) => getCapacityRate(l) > 0 && center.pos.inRangeTo(l, 3))?.id;
  }

  if (!creep.memory.storeId) {
    // 連結する
    const allTargets = _([link, container, storage])
      .flatten<StructureLink | StructureContainer | StructureStorage | StructureTerminal | StructureFactory>()
      .compact();

    // 一番あるやつ
    const max = allTargets.map((s) => s.store.energy).max() || Infinity;
    creep.memory.storeId = (creep.pos.findClosestByPath(allTargets.filter((t) => t.store.energy === max).run()) || factory || terminal || storage)?.id;
  }
  //#endregion
  // region 取り出し処理###############################################################################################
  if (creep.memory.storeId && creep.memory.mode === "🛒") {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store) {
      if (!creep.pos.isNearTo(store)) {
        moveMeTo(store, { range: 1 });
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
  //#endregion
  // #region 輸送先設定処理###############################################################################################
  // 輸送先が満タンになってたら消す
  if (creep.memory.transferId) {
    const store = Game.getObjectById(creep.memory.transferId);
    if (store && "store" in store && store.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      creep.memory.transferId = undefined;
    }
  }

  creep.memory.transferId = creep.memory.transferId || findTransferTarget(creep.room)?.id;
  // それでも見つからないとき
  if (!creep.memory.transferId) {
    return ERR_NOT_FOUND;
  }

  //#endregion 輸送先設定処理################################################
  if (creep.memory.transferId && creep.memory.mode === "🚛") {
    const transferTarget = Game.getObjectById(creep.memory.transferId);
    if (transferTarget) {
      if (!creep.pos.isNearTo(transferTarget)) {
        moveMeTo(transferTarget, { range: 1 });
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
      } else {
        const { extension, spawn } = findMyStructures(room);
        _([...extension, ...spawn].filter((e) => creep.pos.isNearTo(e) && e.store.getFreeCapacity(RESOURCE_ENERGY)))
          .tap(([head]) => {
            if (head) {
              creep.transfer(head, RESOURCE_ENERGY);
            }
          })
          .run();
      }
    } else {
      creep.memory.transferId = undefined;
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

type StructureWithStore = Extract<AnyStructure, { store: StoreDefinition }>;

/**
 * 共通エネルギー溜める順
 */
export function findTransferTarget(room: Room) {
  const center = room.storage || getMainSpawn(room);
  if (!center) {
    console.log(room.name, "center not found");
    return null;
  }

  const all = _(findMyStructures(room).all)
    .filter((x) => "store" in x)
    .run() as StructureWithStore[];

  const getPriority = (s: StructureWithStore) => {
    switch (s.structureType) {
      case "extension":
      case "spawn":
        return 0;
      case "tower":
        return 200;
      case "container":
        // 周囲にリンクがあるときは送らない
        if (
          s.pos.findInRange(FIND_STRUCTURES, 3, {
            filter(s: AnyStructure) {
              return s.structureType === STRUCTURE_LINK;
            },
          }).length > 0 ||
          s.pos.findInRange(FIND_MINERALS, 3, {
            filter(s: AnyStructure) {
              return s.structureType === STRUCTURE_LINK;
            },
          }).length > 0
        ) {
          return 10000;
        } else {
          // それ以外は2番目
          return 100;
        }
      case "link":
        return 10000;
      default:
        return 1000;
    }
  };

  return _(all)
    .filter((s) => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && s.store.energy < s.room.energyCapacityAvailable * 2)
    .sortBy((e) => {
      return getPriority(e) + Math.atan2(e.pos.y - center.pos.y, center.pos.x - e.pos.x);
    })
    .first();
}
