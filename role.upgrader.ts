import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, isStoreTarget, pickUpAll } from "./util.creep";

const behavior: CreepBehavior = (creep: Creeps) => {
  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) =>
    customMove(creep, target, {
      ignoreCreeps: !creep.pos.inRangeTo(target, 4),
      ...opt,
    });

  if (!isUpgrader(creep)) {
    return console.log(`${creep.name} is not Upgrader`);
  }

  if (creep.room.name !== creep.memory.baseRoom) {
    const controller = Game.rooms[creep.memory.baseRoom].controller;
    return controller && moveMeTo(controller);
  }

  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    changeMode(creep, "💪");
  } else if (creep.store.energy === 0) {
    changeMode(creep, "🛒");
  }

  if (!creep.room.controller) {
    return creep.suicide();
  }
  // https://docs.screeps.com/simultaneous-actions.html

  // signController
  if (creep.room.controller.sign?.username !== "Nekane" && creep.name.endsWith("0")) {
    const signed = creep.signController(creep.room.controller, "Please teach me screeps");
    if (signed === ERR_NOT_IN_RANGE) {
      moveMeTo(creep.room.controller);
    } else {
      console.log(`${creep.name}:${RETURN_CODE_DECODER[signed.toString()]}`);
    }
  }

  // upgradeController
  creep.memory.worked = creep.upgradeController(creep.room.controller);
  creep.room.visual.text(
    `${(creep.room.controller.progressTotal - creep.room.controller.progress).toLocaleString()}`,
    creep.room.controller.pos.x,
    creep.room.controller.pos.y - 1,
  );

  switch (creep.memory.worked) {
    // 資源不足
    case ERR_NOT_ENOUGH_RESOURCES:
      changeMode(creep, "🛒");
      break;
    case ERR_NOT_IN_RANGE:
      if (creep.memory.mode === "💪") {
        moveMeTo(creep.room.controller);
      }
      break;
    // 有りえない系
    case ERR_NOT_OWNER:
    case ERR_INVALID_TARGET:
    case ERR_NO_BODYPART:
      console.log(`${creep.name} upgradeController returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
      creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
      break;
    // 問題ない系
    case OK:
    case ERR_BUSY:
    default:
      break;
  }

  // withdraw
  if (
    creep.memory.storeId ||
    (creep.memory.storeId = creep.room.controller.pos.findClosestByRange(FIND_STRUCTURES, {
      // コントローラーから3マス以内の一番近い倉庫に行く
      filter: (s: Structure): s is StoreTarget => {
        return isStoreTarget(s) && ![STRUCTURE_SPAWN, STRUCTURE_EXTENSION].some((t) => t === s.structureType) && !!creep.room.controller?.pos.inRangeTo(s, 3);
      },
    })?.id)
  ) {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store) {
      creep.memory.collected = creep.withdraw(store, RESOURCE_ENERGY);
      switch (creep.memory.collected) {
        case ERR_INVALID_TARGET: // 対象が変
          creep.memory.storeId = undefined;
          break;

        // 満タンまで取った
        case ERR_FULL:
          changeMode(creep, "💪");
          break;
        case ERR_NOT_IN_RANGE:
          if (creep.memory.mode === "🛒") {
            const moved = moveMeTo(store);
            if (moved !== OK) {
              console.log(`${creep.name} ${RETURN_CODE_DECODER[moved.toString()]}`);
              creep.say(RETURN_CODE_DECODER[moved.toString()]);
            }
          }
          break;
        // 有りえない系
        case ERR_NOT_OWNER:
        case ERR_INVALID_ARGS:
          console.log(`${creep.name} build returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
          creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
          break;
        // 問題ない系
        case OK:
        case ERR_BUSY:
        case ERR_NOT_ENOUGH_RESOURCES: // 空っぽ
        default:
          break;
      }
    }
  } else {
    // storeが無いとき
    const { controller } = creep.room;

    // 建設予定を含む射程3以内のコンテナが無いとき
    if (
      controller.pos.findInRange(
        [
          // コンテナ
          ...creep.room.find(FIND_STRUCTURES, { filter: (s): s is StructureContainer => s.structureType === STRUCTURE_CONTAINER }),
          // 建設予定のコンテナ
          ...Object.values(Game.constructionSites).filter((s): s is ConstructionSite<STRUCTURE_CONTAINER> => s.structureType === STRUCTURE_CONTAINER),
        ],
        3,
      ).length === 0
    ) {
      // コントローラから最も近いCreep
      // に最も近いコントローラから3 * 3マス以内の場所
      // にコンテナを立てる
      return controller.pos
        .findClosestByPath(Object.values(Game.spawns), { ignoreCreeps: true })
        ?.pos.findClosestByPath(
          // -3 ~ 3の範囲
          _(
            _.range(-3, 4).map((dx) => {
              return _.range(-3, 4).map((dy) => {
                return creep.room.getPositionAt(controller.pos.x + dx, controller.pos.y + dy);
              });
            }),
          )
            .flatten<RoomPosition | null>(false)
            .compact()
            .run(),
        )
        ?.createConstructionSite(STRUCTURE_CONTAINER);
    }
  }

  // withdraw
  // 落っこちてるものを拾う
  pickUpAll(creep);
};

export default behavior;

function isUpgrader(creep: Creep): creep is Upgrader {
  return creep.memory.role === "upgrader";
}
const changeMode = (creep: Upgrader, mode: UpgraderMemory["mode"]) => {
  if (mode !== creep.memory.mode) {
    creep.say(mode);
    creep.memory.storeId = undefined;
    creep.memory.mode = mode;
  }
};
