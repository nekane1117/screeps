import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, getMainSpawn, pickUpAll } from "./util.creep";
import { findMyStructures } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isM(creep)) {
    return console.log(`${creep.name} is not MineralHarvester`);
  }
  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) =>
    customMove(creep, target, {
      ...opt,
    });

  // harvest
  const mineral = Game.getObjectById(creep.memory.targetId);
  if (!mineral) {
    // mineralがないことは無いので型チェック用
    // 本当に起こったはとりあえず死ぬ
    return creep.suicide();
  }
  if (creep.store.getFreeCapacity(mineral.mineralType) > 0) {
    creep.memory.worked = creep.harvest(mineral);
    switch (creep.memory.worked) {
      case ERR_NOT_IN_RANGE:
        customMove(creep, mineral);
        break;
      // 来ないはずのやつ
      case ERR_INVALID_TARGET: // 対象が変
      case ERR_NOT_OWNER: // 自creepじゃない
      case ERR_NOT_FOUND: // mineralは対象外
      case ERR_NO_BODYPART: // WORKが無い
        // とりあえずログを出して終わる
        console.log(`${creep.name} harvest returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
        creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
        break;
      // 大丈夫なやつ
      case OK: // OK
      case ERR_TIRED: // 疲れた
      case ERR_NOT_ENOUGH_RESOURCES: // 空っぽ
        break;
      case ERR_BUSY: // spawning
      default:
        creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
        break;
    }

    // 周りのものを拾う
    pickUpAll(creep, mineral.mineralType);
  }

  // 周りの建物に投げる
  const container = _(
    mineral.pos.findInRange(
      [
        ...(findMyStructures(creep.room).container || []),
        ...Object.values(Game.constructionSites).filter(
          (s): s is ConstructionSite<STRUCTURE_CONTAINER> => s.pos.roomName === creep.pos.roomName && s.structureType === STRUCTURE_CONTAINER,
        ),
      ],
      2,
    ),
  ).first();

  // まずそもそも有るか無いか
  if (container) {
    // コンテナかどうか(progressを持ってればsite)
    if (!("progress" in container)) {
      // 渡そうとしてみて遠い時近寄る
      if (creep.transfer(container, mineral.mineralType) === ERR_NOT_IN_RANGE) {
        // 2マス範囲内にあるはずなので中間地点に行く
        moveMeTo(new RoomPosition(Math.round((mineral.pos.x + container.pos.x) / 2), Math.round((mineral.pos.y + container.pos.y) / 2), creep.room.name));
      }
    }
  } else {
    // 存在もしてないし建設中でもない時
    const spawn = getMainSpawn(creep.room);
    if (spawn) {
      const pos = _(
        mineral.pos.findPathTo(spawn, {
          swampCost: 2,
          plainCost: 2,
        }),
      ).run()[1];
      if (pos) {
        creep.room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER);
      }
    } else {
      console.log("spawn not found");
    }
  }
};

export default behavior;
function isM(c: Creeps): c is MineralHarvester {
  return c.memory.role === "mineralHarvester";
}
