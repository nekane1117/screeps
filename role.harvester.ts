import { CreepBehavior } from "./roles";

import { RETURN_CODE_DECODER, customMove, moveRoom, pickUpAll } from "./util.creep";
import { findMyStructures } from "./utils";

/**
 * sourceにとりついて資源を取り続けるだけで移動しない
 * 無いと困るので自分の周囲の建築だけする
 */
const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isHarvester(creep)) {
    console.log(`${creep.name} is not harvester`);
    return ERR_INVALID_TARGET;
  }

  // 違う部屋にいたらとりあえず目的の部屋に行く
  if (creep.room.name !== creep.memory.baseRoom) {
    return moveRoom(creep, creep.room.name, creep.memory.baseRoom);
  }

  // harvest
  const source = Game.getObjectById(creep.memory.harvestTargetId);
  if (!source) {
    // sourceがないことは無いので型チェック用
    // 本当に起こったはとりあえず死ぬ
    return creep.suicide();
  }
  creep.memory.worked = creep.harvest(source);
  switch (creep.memory.worked) {
    case ERR_NOT_IN_RANGE:
      customMove(creep, source, { ignoreCreeps: true });
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
    case ERR_NOT_ENOUGH_RESOURCES: // 空っぽ
      break;
    case ERR_TIRED: // 疲れた
    case ERR_BUSY: // spawning
    default:
      creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
      break;
  }

  // build
  // 射程圏内の建設はとりあえずぜんぶ叩いておく
  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.getActiveBodyparts(WORK) * 5) {
    creep.pos.findInRange(Object.values(Game.constructionSites), 3).map((site) => creep.build(site));
  }

  // repair
  const repaired = _(
    creep.pos.findInRange(FIND_STRUCTURES, 3, { filter: (s) => "ticksToDecay" in s && s.hits < s.hitsMax - creep.getActiveBodyparts(WORK) * REPAIR_POWER }),
  )
    .map((damaged) => {
      return creep.repair(damaged);
    })
    .run();

  // 周りのものを拾う
  pickUpAll(creep);

  if (repaired.length === 0) {
    // 周りの建物に投げる
    const { container: containers, link: links } = findMyStructures(creep.room);

    const link = source.pos.findClosestByRange(links, {
      filter: (s: StructureLink) => s.pos.inRangeTo(source, 2),
    });
    if (link) {
      // リンクがあるときは周囲のコンテナから吸う
      creep.pos.findInRange(containers, 2).forEach((c) => {
        if (creep.withdraw(c, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE && creep.store.energy > 10) {
          customMove(creep, c);
        }
      });

      if (creep.transfer(link, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE && creep.store.energy > 10) {
        customMove(creep, link);
      }
    } else {
      const container = source.pos.findClosestByRange(containers, {
        filter: (s: StructureContainer) => s.pos.inRangeTo(source, 2),
      });
      if (container) {
        if (creep.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          customMove(creep, container);
        }
      }
    }
  }
};

export default behavior;

function isHarvester(c: Creeps): c is Harvester {
  return "role" in c.memory && c.memory.role === "harvester";
}
