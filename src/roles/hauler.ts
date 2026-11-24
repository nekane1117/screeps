import { findMyStructures } from "../utils";
import { customMove, getMainSpawn, moveRoom, RETURN_CODE_DECODER, toColor } from "../utils/creep";
import { findTransferTarget } from "./carrier";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isTarget(creep)) {
    console.log(`${creep.name} is not harvester`);
    return ERR_INVALID_TARGET;
  }
  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) => {
    const pos = "pos" in target ? target.pos : target;
    Game.rooms[pos.roomName]?.visual.text("x", pos, {
      color: toColor(creep),
    });
    return customMove(creep, target, {
      maxRooms: 0,
      ...opt,
    });
  };

  // 違う部屋にいたらとりあえず目的の部屋に行く
  if (creep.room.name !== creep.memory.baseRoom) {
    const targetRoom = Game.rooms[creep.memory.baseRoom];
    creep.say(targetRoom ? "GOTO " + targetRoom.name : "invisible room");
    if (targetRoom) {
      const source = targetRoom.controller || _.first(targetRoom.find(FIND_SOURCES)) || new RoomPosition(25, 25, targetRoom.name);
      return customMove(creep, source);
    } else {
      return moveRoom(creep, creep.room.name, creep.memory.baseRoom);
    }
  }

  // 面倒なのでreadonlyでエイリアス
  const memory: Readonly<HaulerMemory> = creep.memory;
  const mainSpawn = getMainSpawn(creep.room);

  // #region ソースの取得とソースチェック##################################################
  const source = Game.getObjectById(memory.sourceId);
  if (!source) {
    creep.say("NO SOURCE");
    if (mainSpawn) {
      if (creep.pos.isNearTo(mainSpawn)) {
        return mainSpawn.recycleCreep(creep);
      } else {
        return moveMeTo(mainSpawn);
      }
    } else {
      return creep.suicide();
    }
  }
  // #endregion ソースの取得とソースチェック##################################################

  // #region モード切替 ###############################################################
  /** モード切替 */
  const checkMode = () => {
    let newMode: "D" | "G" = creep.memory.mode;
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      newMode = "D";
    } else if (creep.store.energy === 0) {
      newMode = "G";
    }

    if (creep.memory.mode !== newMode) {
      creep.say(newMode);
      creep.memory.mode = newMode;
      delete creep.memory.targetId;
      delete creep.memory.transferId;
    }
  };
  checkMode();
  // #endregion モード切替 ###############################################################
  // #region    仕事 ####################################################################
  if (memory.mode === "D") {
    // #region    分配モード ###############################################################
    let storage = memory.transferId && Game.getObjectById(memory.transferId);
    // 見つからないかいっぱいの時は更新する
    if (!storage || storage.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      // ストレージがあるときはストレージ優先
      if (creep.room.storage) {
        storage = creep.room.storage;
      } else {
        storage = findTransferTarget(creep.room);
      }
      creep.memory.transferId = storage?.id;
    }

    // それすら見つからないときは終わる
    if (!storage) {
      // storageができるまでたまーにあるくらいのはず
      // 実質ないはずなので一応sayするだけ
      creep.say("NO STORAGE");
      creep.memory.mode = "G";
      delete creep.memory.targetId;
      delete creep.memory.transferId;
      return ERR_NOT_FOUND;
    }

    // 渡してみて届かなければ移動する
    // それ以外のエラーコードは様子見
    const transfered = creep.transfer(storage, RESOURCE_ENERGY);
    switch (transfered) {
      case ERR_NOT_IN_RANGE:
        moveMeTo(storage);
        break;
      case OK:
      case ERR_FULL:
        // 問題なし
        break;
      default:
        creep.say(RETURN_CODE_DECODER[transfered.toString()]);
    }

    // #endregion 分配モード ###############################################################
  } else {
    // #region    収集モード#################################################################
    // #region 取得元確認 ###############################################################

    // 存在チェック
    let target: Resource | AnyStoreStructure | undefined | null | Tombstone | Ruin = creep.memory.targetId && Game.getObjectById(creep.memory.targetId);

    // 見つからないか空の時は更新する
    if (!target || ("store" in target && target.store.energy === 0)) {
      const { container = [], link = [] } = findMyStructures(creep.room);
      // drop ->メインのリンク or 墓 or 廃墟
      target =
        mainSpawn?.pos.findClosestByRange(link, { filter: (l) => l.pos.inRangeTo(mainSpawn, 3) && l.store.energy > CARRY_CAPACITY }) ||
        source.pos.findClosestByRange(FIND_DROPPED_RESOURCES, { filter: (s) => s.resourceType === RESOURCE_ENERGY }) ||
        source.pos.findClosestByRange([...source.pos.findInRange(container, 3), ...source.room.find(FIND_TOMBSTONES), ...source.room.find(FIND_RUINS)], {
          filter: (s) => s.store.energy > 0,
        });

      // 取れたターゲットを記録する
      creep.memory.targetId = target?.id;
    }

    if (!target) {
      // それでもなければ担当に近づいておいて終わる
      return moveMeTo(source, { range: 3 });
    }

    // #endregion 取得元確認 ###############################################################
    const worked = "resourceType" in target ? creep.pickup(target) : creep.withdraw(target, RESOURCE_ENERGY);

    // 離れてたら近づく
    // 他のエラーは様子見
    switch (worked) {
      case ERR_NOT_IN_RANGE:
        moveMeTo(target);
        break;
      case OK:
        // 問題なし
        break;
      default:
        creep.say(RETURN_CODE_DECODER[worked.toString()]);
    }
    // #endregion 収集モード#################################################################
  }
  // #endregion 仕事 ####################################################################
};
export default behavior;

function isTarget(c: Creep): c is Hauler {
  return "role" in c.memory && c.memory.role === "hauler";
}
