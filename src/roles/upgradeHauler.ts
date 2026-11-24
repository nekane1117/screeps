import { findMyStructures } from "../utils";
import { customMove, getMainSpawn, moveRoom, RETURN_CODE_DECODER, toColor } from "../utils/creep";

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
  const memory: Readonly<UpgradeHaulerMemory> = creep.memory;
  const controller = Game.getObjectById(creep.memory.controllerId);
  if (!controller) {
    return creep.say("NO CONTROLLER");
  }
  const { container, link } = findMyStructures(controller.room);

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
      delete creep.memory.storeId;
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
      // 3マス以内で空きのあるコンテナかリンク
      storage = controller.pos.findClosestByPath([...container, ...link], {
        filter: (c) => {
          return c.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && controller.pos.inRangeTo(c, 3);
        },
        ignoreCreeps: true,
      });
      creep.memory.transferId = storage?.id;
    }

    // それすら見つからないときは終わる
    if (!storage) {
      creep.say("NO STORAGE");
      // 集めに行っておく
      creep.memory.mode = "G";
      delete creep.memory.storeId;
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
    const mainSpawn = getMainSpawn(controller.room) || new RoomPosition(25, 25, controller.room.name);

    // #region 取得元確認 ###############################################################

    // 存在チェック
    let target = creep.memory.storeId && Game.getObjectById(creep.memory.storeId);

    // 見つからないか空の時は更新する
    if (!target || ("store" in target && target.store.energy === 0)) {
      target = undefined;
    }

    // ストレージにいっぱいあるときはストレージから
    if (!target && controller.room.storage) {
      target = controller.room.storage;
    }

    // ストレージが無ければコンテナ用じゃないやつでエネルギーがあるやつ
    if (!target) {
      target = controller.pos.findClosestByPath([...container, ...link], {
        filter: (c) => {
          return c.store.energy > CARRY_CAPACITY && !c.pos.inRangeTo(controller, 3);
        },
      });
    }

    if (!target) {
      // それでもなければ真ん中に近づいておいて終わる
      return moveMeTo(mainSpawn, { range: 3 });
    }

    // #endregion 取得元確認 ###############################################################
    const worked = creep.withdraw(target, RESOURCE_ENERGY);

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

function isTarget(c: Creep): c is UpgradeHauler {
  return "role" in c.memory && c.memory.role === "upgradeHauler";
}
