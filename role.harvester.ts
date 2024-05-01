import { RETURN_CODE_DECODER } from "./constants";

/**
 * sourceにとりついて資源を取り続けるだけで移動しない
 * 無いと困るので自分の周囲の建築だけする
 */
const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isMe(creep)) {
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
  creep.memory.harvested = creep.harvest(source);
  switch (creep.memory.harvested) {
    case ERR_NOT_IN_RANGE: {
      // 移動してみる
      if (
        creep.moveTo(source, {
          // 道を優先
          plainCost: 2,
          // ３ますより遠いときは同じ道を走る
          ignoreCreeps: !creep.pos.inRangeTo(source, 3),
        }) === ERR_NO_PATH
      ) {
        // 正面になんかあるとき
        for (const neighbor of creep.pos.findInRange(FIND_MY_CREEPS, 1)) {
          // 最初に出会ったやつと場所を入れ替わってみる
          if (creep.pull(neighbor) === OK && neighbor.moveTo(creep) === OK) {
            break;
          }
        }
      }
      break;
    }
    // 来ないはずのやつ
    case ERR_INVALID_TARGET: // 対象が変
    case ERR_NOT_OWNER: // 自creepじゃない
    case ERR_NOT_FOUND: // mineralは対象外
    case ERR_NO_BODYPART: // WORKが無い
      // とりあえずログを出して終わる
      console.log(`${creep.name} harvest returns ${RETURN_CODE_DECODER[creep.memory.harvested.toString()]}`);
      creep.say(RETURN_CODE_DECODER[creep.memory.harvested.toString()]);
      break;
    // 大丈夫なやつ
    case ERR_NOT_ENOUGH_RESOURCES: // 空っぽ
    case OK: // OK
    case ERR_TIRED: // 疲れた
    case ERR_BUSY: // spawning
    default:
      break;
  }

  // build
  creep.pos.findInRange(Object.values(Game.constructionSites), 3).map((site) => creep.build(site));

  return creep.memory.harvested;
};

export default behavior;

function isMe(c: Creeps): c is Harvester {
  return c.memory.role === "harvester";
}
