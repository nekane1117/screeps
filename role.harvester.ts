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
      customMove(creep, source);
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

  // 周りのものを拾う
  pickUpAll(creep);

  // 周りの建物に投げる
  const structures = _(creep.pos.findInRange(FIND_STRUCTURES, 1, { filter: (s): s is HasStore => "store" in s })).sort((s) => {
    switch (s.structureType) {
      case STRUCTURE_LINK:
      case STRUCTURE_EXTENSION:
        // 優先
        return 0;
      case STRUCTURE_CONTAINER:
      case STRUCTURE_STORAGE:
        // 取り出し
        return 2;
      case STRUCTURE_FACTORY:
      case STRUCTURE_LAB:
      case STRUCTURE_NUKER:
      case STRUCTURE_POWER_SPAWN:
      case STRUCTURE_SPAWN:
      case STRUCTURE_TERMINAL:
      case STRUCTURE_TOWER:
      default:
        return 1;
    }
  });

  const extractor = structures.filter((s) => s.store.energy).last();
  // 空きのある最初のやつ
  const store = structures.filter((s) => s.store.getFreeCapacity(RESOURCE_ENERGY)).first();

  if (extractor) {
    creep.withdraw(extractor, RESOURCE_ENERGY);
  }
  if (store) {
    creep.transfer(store, RESOURCE_ENERGY);
  }
};

export default behavior;

function isHarvester(c: Creeps): c is Harvester {
  return "role" in c.memory && c.memory.role === "harvester";
}
