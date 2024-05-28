import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, getCreepsInRoom, getMainSpawn, pickUpAll, withdrawBy } from "./util.creep";
import { findMyStructures, getCapacityRate } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  const { room } = creep;
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
  const spawn = getMainSpawn(room);
  if (!spawn) {
    return creep.say("spawn not found");
  }
  // https://docs.screeps.com/simultaneous-actions.html

  const { extension, spawn: spawns, link, tower, container: containers } = findMyStructures(room);
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
    creep.memory.storeId = (
      (() => {
        const extructor = spawn.pos.findClosestByRange(link);
        return extructor && extructor.store.energy >= CARRY_CAPACITY ? extructor : undefined;
      })() ||
      creep.pos.findClosestByRange(_.compact([...(room.energyAvailable < room.energyCapacityAvailable ? [room.storage, room.terminal] : []), ...containers]), {
        filter: (s: StructureContainer) => {
          return (containers.length < 2 || controllerContaeiner?.id !== s.id) && s.store.energy >= CARRY_CAPACITY;
        },
      }) ||
      creep.pos.findClosestByRange(_.compact([room.storage, room.terminal]), {
        filter: (s: StructureTerminal | StructureStorage) => {
          return s.store.energy >= room.energyCapacityAvailable + creep.store.getCapacity(RESOURCE_ENERGY);
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
    getCreepsInRoom(room)
      .filter((c): c is Carrier => c.memory.role === "carrier")
      .every((g) => g.memory.transferId !== id);

  //spawnかextension
  if (!creep.memory.transferId) {
    creep.memory.transferId = _([...extension, ...spawns])
      .filter((s) => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && exclusive(s))
      .sort((s1, s2) => s1.pos.y - s2.pos.y)
      .first()?.id;
  }

  // storageにキャッシュ
  if (!creep.memory.transferId && room.terminal && room.terminal.store.energy < room.energyCapacityAvailable) {
    creep.memory.transferId = room.terminal.id;
  }

  // storageにキャッシュ
  if (!creep.memory.transferId && room.storage && room.storage.store.energy < room.energyCapacityAvailable) {
    creep.memory.transferId = room.storage.id;
  }

  // タワーに入れて修理や防御
  if (!creep.memory.transferId) {
    creep.memory.transferId = creep.pos.findClosestByRange(tower, {
      filter: (t: StructureTower) => {
        return getCapacityRate(t) < 1 && (tower.length < 2 || exclusive(t));
      },
    })?.id;
  }

  // コントローラー強化
  if (!creep.memory.transferId) {
    creep.memory.transferId = (controllerContaeiner && getCapacityRate(controllerContaeiner) < 0.9 ? controllerContaeiner : undefined)?.id;
  }

  if (!creep.memory.transferId) {
    // 最寄りのbuilderに向かう
    creep.memory.transferId = creep.pos.findClosestByRange(
      Object.values(Game.creeps).filter((c) => c.memory.role === "builder" && c.store.getFreeCapacity(RESOURCE_ENERGY) && exclusive(c)),
    )?.id;
  }
  // 貯蓄
  if (!creep.memory.transferId) {
    creep.memory.transferId = spawn.pos.findClosestByRange(_.compact([...link, room.storage, room.terminal]), {
      filter: (s: StructureSpawn | StructureExtension) => {
        return s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
      },
    })?.id;
  }
  // それでも見つからないとき
  if (!creep.memory.transferId) {
    return ERR_NOT_FOUND;
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
      } else {
        _(extension.filter((e) => creep.pos.isNearTo(e) && e.store.getFreeCapacity(RESOURCE_ENERGY)))
          .tap(([head]) => {
            if (head) {
              creep.transfer(head, RESOURCE_ENERGY);
            }
          })
          .run();
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
