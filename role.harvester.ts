import { CreepBehavior } from "./roles";

import { RETURN_CODE_DECODER, customMove, pickUpAll } from "./util.creep";

/**
 * sourceにとりついて資源を取り続けるだけで移動しない
 * 無いと困るので自分の周囲の建築だけする
 */
const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isHarvester(creep)) {
    console.log(`${creep.name} is not harvester`);
    return ERR_INVALID_TARGET;
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
      customMove(creep, source, {
        visualizePathStyle: { stroke: "#00ff00" },
      });
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
      break;
    case ERR_NOT_ENOUGH_RESOURCES: // 空っぽ
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

  // 周りのものを拾う
  pickUpAll(creep);

  // 周りの建物に投げる
  creep.pos.findInRange(FIND_STRUCTURES, 1, { filter: (s) => "store" in s }).map((s) => creep.transfer(s, RESOURCE_ENERGY));
};

export default behavior;

function isHarvester(c: Creeps): c is Harvester {
  return "role" in c.memory && c.memory.role === "harvester";
}
