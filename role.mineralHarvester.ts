import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, REVERSE_BOOSTS, customMove } from "./util.creep";
import { getLabs } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isM(creep)) {
    return console.log(`${creep.name} is not MineralHarvester`);
  }
  const storage = creep.room.storage;
  if (!storage) {
    return creep.say("NO STORAGE");
  }

  if (boost(creep) !== OK) {
    return;
  }
  // harvest
  const mineral = Game.getObjectById(creep.memory.targetId);
  if (!mineral) {
    // mineralがないことは無いので型チェック用
    // 本当に起こったはとりあえず死ぬ
    return creep.suicide();
  }
  //#region モードチェック
  const checkMode = () => {
    const newMode: MineralHarvesterMemory["mode"] = ((c: MineralHarvester) => {
      if (c.memory.mode !== "delivering" && c.memory.mode !== "gathering") {
        return "gathering";
      }

      if (c.memory.mode === "delivering" && c.store.getUsedCapacity() === 0) {
        // 配送モードで空になったら収集モードにする
        return "gathering";
      }

      if (
        c.memory.mode === "gathering" &&
        creep.store.getFreeCapacity(mineral.mineralType) <
          creep.body.reduce((total, b) => {
            if (b.type === WORK) {
              return total + HARVEST_MINERAL_POWER * ((b.boost && REVERSE_BOOSTS.harvest[b.boost]) || 1);
            }
            return total;
          }, 0)
      ) {
        // 収集モードで容量不足になったら配送モードになる
        return "delivering";
      }

      // そのまま
      return c.memory.mode;
    })(creep);
    if (newMode !== creep.memory.mode) {
      creep.memory.mode = newMode;
      creep.memory.storeId = undefined;
      creep.memory.pickUpId = undefined;
      creep.say(creep.memory.mode);
    }
  };
  checkMode();

  if (creep.memory.mode === "delivering") {
    delivery(creep);
  } else {
    work(creep);
  }
};

export default behavior;
function isM(c: Creeps): c is MineralHarvester {
  return c.memory.role === "mineralHarvester";
}

function work(creep: MineralHarvester) {
  // 落ちてるのを探す
  creep.memory.pickUpId =
    creep.memory.pickUpId || creep.pos.findClosestByPath(creep.room.find(FIND_DROPPED_RESOURCES, { filter: (r) => r.resourceType !== RESOURCE_ENERGY }))?.id;
  if (creep.memory.pickUpId) {
    const resource = Game.getObjectById(creep.memory.pickUpId);
    if (resource) {
      const picked = creep.pickup(resource);
      switch (creep.pickup(resource)) {
        // 遠い
        case ERR_NOT_IN_RANGE:
          customMove(creep, resource);
          break;

        // 問題ない系
        case OK:
          break;
        // それ以外のよくわからないやつは初期化
        default:
          creep.memory.pickUpId = undefined;
      }
      return picked;
    } else {
      creep.memory.pickUpId = undefined;
    }
  }

  const mineral = Game.getObjectById(creep.memory.targetId);
  // 型チェック
  if (!mineral) {
    // ありえないはずなので無かったら死ぬ
    return creep.suicide();
  }

  creep.memory.worked = creep.harvest(mineral);

  switch (creep.memory.worked) {
    case ERR_NOT_IN_RANGE:
      customMove(creep, mineral, {
        range: 1,
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
    case ERR_NOT_ENOUGH_RESOURCES: // 空っぽ
    case ERR_TIRED: // 疲れた
      break;
    case ERR_BUSY: // spawning
    default:
      creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
      break;
  }
}

function delivery(creep: MineralHarvester) {
  const storage = creep.room.storage;
  if (!storage) {
    return creep.say("NO STORAGE");
  }

  const returns = RESOURCES_ALL.map((r) => creep.transfer(storage, r));
  if (RESOURCES_ALL.map((r) => creep.transfer(storage, r)).find((ret) => ret === ERR_NOT_IN_RANGE)) {
    return customMove(creep, storage, {
      range: 1,
    });
  }
  return returns.find((r) => r !== OK) || OK;
}
// ブースト優先度順
const BOOSTS = [RESOURCE_CATALYZED_UTRIUM_ALKALIDE, RESOURCE_UTRIUM_ALKALIDE, RESOURCE_UTRIUM_OXIDE];

function boost(creep: MineralHarvester) {
  const minBoosted = _(creep.body.filter((b) => b.type === WORK)).min((b) => (b.boost || "").length).boost;

  // 完全にboostされてるときは無視
  if (minBoosted === RESOURCE_CATALYZED_UTRIUM_ALKALIDE || minBoosted === RESOURCE_UTRIUM_ALKALIDE) {
    return OK;
  }

  const labs = getLabs(creep.room);
  const target = labs
    // 型が正しくて容量があるやつだけにする
    .filter((l) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return l.memory.expectedType && BOOSTS.includes(l.memory.expectedType as any) && l.store.getUsedCapacity(l.memory.expectedType) > LAB_BOOST_MINERAL;
    })
    // 優先順で一番優先のやつ
    .sort((l) => {
      const idx = (l.memory.expectedType && BOOSTS.findIndex((b) => b === l.memory.expectedType)) || -1;
      if (idx > 0) {
        return idx;
      } else {
        return Infinity;
      }
    })
    .run()?.[0];

  if (!target) {
    return OK;
  }

  const result = target.boostCreep(creep);
  if (result === ERR_NOT_IN_RANGE) {
    customMove(creep, target);
  }
  return result;
}
