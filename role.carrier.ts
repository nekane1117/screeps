import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, getCreepsInRoom, getMainSpawn, pickUpAll, withdrawBy } from "./util.creep";
import { findMyStructures, getCapacityRate } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  const { room } = creep;

  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) => {
    customMove(creep, target, {
      plainCost: 2,
      swampCost: 2,
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

      if (c.memory.mode === "🛒" && creep.store.energy >= (creep.room.controller ? EXTENSION_ENERGY_CAPACITY[creep.room.controller.level] : CARRY_CAPACITY)) {
        // 収集モードで半分超えたら作業モードにする
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
        (creep.room.memory.carrySize = creep.room.memory.carrySize || {}).carrier =
          ((creep.room.memory.carrySize?.carrier || 100) * 100 + creep.store.energy) / 101;
      }
    }
  }
  checkMode();
  const mainSpawn = getMainSpawn(room);
  if (!mainSpawn) {
    return creep.say("spawn not found");
  }
  // https://docs.screeps.com/simultaneous-actions.html

  const { extension, spawn: spawns, link, tower, container: containers, lab: labs } = findMyStructures(room);
  const controllerContaeiner = room.controller && _(room.controller.pos.findInRange(containers, 3)).first();

  // 取得元設定処理###############################################################################################

  // 取得元が空になってたら消す
  if (creep.memory.storeId) {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store && "store" in store && store.store.energy < CARRY_CAPACITY) {
      creep.memory.storeId = undefined;
    }
  }

  if (!creep.memory.storeId) {
    // つっかえちゃうので取り出しようlinkは優先的に取り出す
    creep.memory.storeId = (() => {
      const extructor = mainSpawn.pos.findClosestByRange(link);
      return extructor && extructor.store.energy >= CARRY_CAPACITY ? extructor : undefined;
    })()?.id;
  }

  // extensionが満たされてないときはとにかく取り出す
  if (!creep.memory.storeId && room.energyAvailable < room.energyCapacityAvailable) {
    creep.memory.storeId = creep.pos.findClosestByRange(_.compact([room.storage, ...containers]), {
      filter: (s: StructureContainer) => {
        return (containers.length < 2 || controllerContaeiner?.id !== s.id) && s.store.energy > 0;
      },
    })?.id;
  }

  // storageにもないときはターミナルからももらう
  if (!creep.memory.storeId && room.energyAvailable < room.energyCapacityAvailable && (room.terminal?.store.energy || 0) >= CARRY_CAPACITY) {
    creep.memory.storeId = room.terminal?.id;
  }

  // extensionが満たされてないときはとにかく取り出す
  if (!creep.memory.storeId) {
    creep.memory.storeId = creep.pos.findClosestByRange(containers, {
      filter: (s: StructureContainer) => {
        return (containers.length < 2 || controllerContaeiner?.id !== s.id) && s.store.energy >= CARRY_CAPACITY;
      },
    })?.id;
  }

  // 余剰分を確保しつつstorageやターミナルから持っていく
  if (!creep.memory.storeId) {
    creep.memory.storeId = creep.pos.findClosestByRange(_.compact([room.storage, room.terminal]), {
      filter: (s: StructureTerminal | StructureStorage) => {
        return s.store.energy >= room.energyCapacityAvailable + creep.store.getCapacity(RESOURCE_ENERGY);
      },
    })?.id;
  }

  // それすらないときはharvesterに寄っておく
  if (!creep.memory.storeId) {
    const storageOrHarvester =
      creep.room.storage ||
      creep.room.terminal ||
      creep.pos.findClosestByRange(getCreepsInRoom(creep.room).harvester || [], { filter: (c: Harvester) => c.store.energy > 0 });
    if (storageOrHarvester && !creep.pos.isNearTo(storageOrHarvester)) {
      moveMeTo(storageOrHarvester, { range: 1 });
    }
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

  // #region 輸送先設定処理###############################################################################################

  // 輸送先が満タンになってたら消す
  if (creep.memory.transferId) {
    const store = Game.getObjectById(creep.memory.transferId);
    if (store && "store" in store && store.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      creep.memory.transferId = undefined;
    }
  }

  // 他のcarrierに設定されていない
  const exclusive = ({ id }: _HasId) =>
    _(getCreepsInRoom(room).carrier || [])
      .compact()
      .every((g) => g?.memory?.transferId !== id);

  //spawnかextension
  if (!creep.memory.transferId) {
    // 上から順番に詰める
    const targets = _([...extension, ...spawns]).filter((s) => s.store.getFreeCapacity(RESOURCE_ENERGY));
    const min = targets
      .map((e) => {
        return Math.atan2(e.pos.x - mainSpawn.pos.x, e.pos.y - mainSpawn.pos.y);
      })
      .min();

    creep.memory.transferId = creep.pos.findClosestByRange(
      targets
        .filter((s) => {
          return Math.atan2(s.pos.x - mainSpawn.pos.x, s.pos.y - mainSpawn.pos.y) <= min;
        })
        .value(),
    )?.id;
  }

  // タワーに入れて修理や防御
  if (!creep.memory.transferId) {
    creep.memory.transferId = creep.pos.findClosestByRange(tower, {
      filter: (t: StructureTower) => {
        return getCapacityRate(t) < 0.9 && (tower.length < 2 || exclusive(t));
      },
    })?.id;
  }

  // terminalにキャッシュ
  if (!creep.memory.transferId && room.terminal && room.terminal.store.energy < room.energyCapacityAvailable) {
    creep.memory.transferId = room.terminal.id;
  }

  // Labに入れておく
  if (!creep.memory.transferId) {
    creep.memory.transferId = _(labs)
      .filter((lab) => getCapacityRate(lab) < 0.8)
      .sort((l1, l2) => l1.store.energy - l2.store.energy)
      .first()?.id;
  }

  // storageにキャッシュ
  if (!creep.memory.transferId && room.storage && room.storage.store.energy < room.energyCapacityAvailable) {
    creep.memory.transferId = room.storage.id;
  }

  // コントローラー強化
  if (!creep.memory.transferId) {
    creep.memory.transferId = (controllerContaeiner && getCapacityRate(controllerContaeiner) < 1 ? controllerContaeiner : undefined)?.id;
  }

  // 貯蓄
  if (!creep.memory.transferId) {
    creep.memory.transferId = _([room.storage, room.terminal])
      .compact()
      .sortBy((s) => s.store.energy)
      .first()?.id;
  }
  // それでも見つからないとき
  if (!creep.memory.transferId) {
    return ERR_NOT_FOUND;
  }

  //#endregion 輸送先設定処理################################################

  if (creep.memory.transferId && creep.memory.mode === "🚛") {
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
      } else {
        _([...extension, ...spawns].filter((e) => creep.pos.isNearTo(e) && e.store.getFreeCapacity(RESOURCE_ENERGY)))
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
