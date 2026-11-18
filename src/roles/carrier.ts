import { TRANSFER_THRESHOLD } from "../constants";
import { findMyStructures, getCapacityRate, getLabs } from "../utils";
import { RETURN_CODE_DECODER, customMove, getCreepsInRoom, getMainSpawn, pickUpAll, withdrawBy } from "../utils/creep";

const behavior: CreepBehavior = (creep: Creeps) => {
  const { room } = creep;

  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) => {
    customMove(creep, target, {
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
      if (c.memory.mode === "D" && creep.store.energy === 0) {
        // 作業モードで空になったら収集モードにする
        return "G";
      }

      if (
        c.memory.mode === "G" &&
        creep.store.energy >= Math.max(creep.store.getCapacity(RESOURCE_ENERGY) / 2, EXTENSION_ENERGY_CAPACITY[creep.room.controller?.level || 0])
      ) {
        // 収集モードで半分超えたら作業モードにする
        return "D";
      }

      // そのまま
      return c.memory.mode;
    })(creep);

    if (creep.memory.mode !== newMode) {
      creep.say(newMode);
      creep.memory.mode = newMode;
      // モードが変わったら取得先・輸送先をリセットする
      if (newMode === "G") {
        creep.memory.storeId = undefined;
      }
      creep.memory.transferId = undefined;

      // 運搬モードに切り替えたときの容量を記憶する
      if (newMode === "D") {
        const alpha = 0.01;
        (creep.room.memory.carrySize = creep.room.memory.carrySize || {}).carrier =
          (creep.room.memory.carrySize?.carrier || 100) * (1 - alpha) + creep.store.energy * alpha;
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
    if (!store || ("store" in store && store.store.energy < CARRY_CAPACITY)) {
      creep.memory.storeId = undefined;
    }
  }

  // とにかくまずstorageから配る
  if (!creep.memory.storeId && creep.room.energyAvailable < creep.room.energyCapacityAvailable && (creep.room.storage?.store.energy || 0)) {
    creep.memory.storeId = creep.room.storage?.id;
  }

  // 落ちてるものはすぐ消えるので集める
  if (!creep.memory.storeId) {
    creep.memory.storeId = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
      filter: (d) => d.resourceType === RESOURCE_ENERGY && d.amount > 0,
    })?.id;
  }

  // 墓も集める
  if (!creep.memory.storeId) {
    creep.memory.storeId = creep.pos.findClosestByPath(FIND_TOMBSTONES, {
      filter: (d) => d.store.energy > 0,
    })?.id;
  }

  // 廃墟も集める
  if (!creep.memory.storeId) {
    creep.memory.storeId = creep.pos.findClosestByPath(FIND_RUINS, {
      filter: (d) => d.store.energy > 0,
    })?.id;
  }

  // 取り出していいやつら
  const { container, link, storage, terminal, factory } = findMyStructures(room);

  // つっかえるので中央のリンクは最優先
  if (!creep.memory.storeId) {
    creep.memory.storeId = link.find((l) => l.store.energy > CARRY_CAPACITY && center.pos.inRangeTo(l, 3))?.id;
  }
  // コントローラー用コンテナ
  const controllerContaeiner = creep.room.controller?.pos.findClosestByRange(container, {
    filter: (c: StructureContainer) => creep.room.controller && c.pos.inRangeTo(creep.room.controller, 3),
  });

  if (!creep.memory.storeId) {
    const { hauler = [] } = getCreepsInRoom(creep.room);

    // 連結する
    const allTargets: (StructureFactory | StructureStorage | StructureTerminal | StructureContainer | undefined)[] = hauler.length
      ? []
      : container.filter((c) => c.id !== controllerContaeiner?.id);

    allTargets.push(storage, factory, terminal);

    // 一番あるやつ
    creep.memory.storeId = _(allTargets)
      .compact()
      .filter((s) => s.store.energy > 0)
      .sortBy((s) => {
        if (s.structureType === STRUCTURE_STORAGE || s.structureType === STRUCTURE_FACTORY || s.structureType === STRUCTURE_TERMINAL) {
          return s.store.energy - s.room.energyAvailable;
        } else {
          return s.store.energy;
        }
      })
      .last()?.id;
  }

  //#endregion
  // region 取り出し処理###############################################################################################
  if (creep.memory.storeId && creep.memory.mode === "G") {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store) {
      if (!creep.pos.isNearTo(store)) {
        moveMeTo(store, { range: 1 });
      }

      if (creep.pos.isNearTo(store)) {
        creep.memory.worked = "resourceType" in store ? creep.pickup(store) : creep.withdraw(store, RESOURCE_ENERGY);
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
  if (creep.memory.transferId && creep.memory.mode === "D") {
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

/**
 * 共通エネルギー溜める順
 */
export function findTransferTarget(room: Room) {
  // 中心は並べ替えの基準にしか使わないので、無いときはcontrollerか部屋の真ん中で代用する
  const center = (room.storage || getMainSpawn(room) || room.controller)?.pos ?? new RoomPosition(25, 25, room.name);
  const { extension, spawn, tower, container, factory } = findMyStructures(room);
  const controllerContaeiner = room.controller && _(room.controller.pos.findInRange(container, 3)).first();
  const { builder = [], upgrader = [] } = getCreepsInRoom(room);
  return _([
    //spawnかextension
    ..._([...extension, ...spawn])
      .filter((s) => s.store.getFreeCapacity(RESOURCE_ENERGY))
      .sortBy((e) => {
        return (
          Math.atan2(e.pos.y - center.y, center.x - e.pos.x) +
          (_(Object.values(getCreepsInRoom(room)) || [])
            .flatten<Creeps>()
            .find((c) => c.memory && "transferId" in c.memory && c.memory.transferId === e.id)
            ? Math.PI * 2
            : 0)
        );
      })
      .run(),
    // タワーに入れて防衛
    ...tower.filter((t) => t.store.getFreeCapacity(RESOURCE_ENERGY) > 0),
    room.terminal?.my && (room.terminal?.store.energy || 0) <= _.floor(TRANSFER_THRESHOLD * 2, -2) ? room.terminal : null,
    ...getLabs(room)
      .filter((l) => l.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
      .run(),
    // storageにキャッシュ
    (room.storage?.store.energy || 0) < room.energyCapacityAvailable && room.storage?.my ? room.storage : null,
    // コントローラー強化
    controllerContaeiner && getCapacityRate(controllerContaeiner) < 0.9 ? controllerContaeiner : null,
    //貯蓄順
    (factory?.store.energy || 0) <= _.floor(TRANSFER_THRESHOLD, -2) ? factory : null,
    room.storage,
    ...builder.filter((c) => c.store.getFreeCapacity(RESOURCE_ENERGY) > 0),
    ...upgrader.filter((c) => c.store.getFreeCapacity(RESOURCE_ENERGY) > 0),
  ])
    .compact()
    .filter((s) => !("my" in s) || s.my)
    .first();
}
