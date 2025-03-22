import { LAB_STRATEGY, REVERSE_REACTIONS, TRANSFER_THRESHOLD } from "./constants";
import { getCreepsInRoom } from "./util.creep";
import { getLabs, getSpawnsInRoom, isCompound } from "./utils";
import { getRoomResouces } from "./utils.common";

export default function behavior(labs: StructureLab[], mineral: Mineral) {
  const firstLab = _.first(labs);
  const room = firstLab?.room;
  if (!firstLab || !room) {
    // ラボが1個も無ければ終わる
    return;
  }

  // とりあえず初期化
  firstLab.room.memory.labs = firstLab.room.memory.labs || {};
  const labId = labs.map((lab) => lab.id);

  // 壊れたときのことを考えてメモリの削除処理
  (Object.keys(firstLab.room.memory.labs) as Id<StructureLab>[]).forEach((id) => {
    if (!labId.includes(id) && mineral.room) {
      delete mineral.room.memory.labs[id];
    }
  });

  const { labManager = [] } = getCreepsInRoom(firstLab.room);

  // 管理者を作る
  if (
    firstLab.room.terminal &&
    firstLab.room.terminal.store.energy > TRANSFER_THRESHOLD &&
    firstLab.room.energyAvailable === firstLab.room.energyCapacityAvailable &&
    labManager.length === 0
  ) {
    const spawn = getSpawnsInRoom(firstLab.pos.roomName)?.find((s) => !s.spawning);
    if (spawn) {
      spawn.spawnCreep(getManagerBody(firstLab.room), `Lm_${firstLab.room.name}_${Game.time}`, {
        memory: {
          baseRoom: firstLab.room.name,
          mode: "G",
          role: "labManager",
        } as LabManagerMemory,
      });
    }
  }

  // メモリを埋め込んだLABの情報を作る
  const labWithMemory = labs.map((lab) => {
    // メモリの取得ついでに初期化
    const memory = lab.room.memory.labs[lab.id] || (lab.room.memory.labs[lab.id] = { expectedType: undefined });

    // 続きの処理のために埋め込む
    return Object.assign(lab, { memory }) as StructureLab & { memory: LabMemory };
  });
  // モードが違うときと1500tickに1回くらい更新する
  if (Game.time % (CREEP_LIFE_TIME / 3) === 0) {
    room.memory.labMode = checkMode(room);
    const finalProducts = _.clone(LAB_STRATEGY[room.memory.labMode]);
    if (!finalProducts) {
      console.log("strategy is not defined: " + room.memory.labMode);
      return ERR_INVALID_ARGS;
    }

    const strategy = _(generateStrategy(room, [finalProducts]).reverse())
      .uniq()
      .run();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (room.memory as any).labStrategy;

    // メモリを埋め込んだLABの情報を作る
    labWithMemory.forEach((lab, i) => {
      lab.memory.expectedType = strategy[i];
    });
  }

  // labの長さの分だけ処理する
  labWithMemory.map((lab) => {
    if (lab.memory.expectedType) {
      lab.room.visual.text(lab.memory.expectedType, lab.pos.x, lab.pos.y, {
        color: "#ffff00",
        font: 0.75,
        strokeWidth: 2,
      });
    }

    const ingredients = lab.memory.expectedType && REVERSE_REACTIONS[lab.memory.expectedType];
    // 要求通りのタイプを持っていて素材リストを持っている
    if ((!lab.mineralType || lab.mineralType === lab.memory.expectedType) && ingredients) {
      const [l1, l2] = ingredients.map((type) => {
        return labWithMemory.find((l) => {
          // 素材を要求していて
          // 要求通りのタイプを持っている
          return l.mineralType === type && l.store[type] >= LAB_REACTION_AMOUNT;
        });
      });
      if (l1 && l2) {
        lab.runReaction(l1, l2);
      }
    }
    return;
  });
}

function checkMode(room: Room) {
  const {
    builder = [],
    // mineralHarvester = []
  } = getCreepsInRoom(room);

  // if (!isBoosted(mineralHarvester)) {
  //   return "mineralHarvester";
  // } else
  if (!isBoosted(builder)) {
    return "builder";
  } else {
    return "upgrader";
  }
}
function isBoosted(creeps: Creeps[]) {
  // いない or
  // すべてのWORKが何かしらブースト済み
  return (
    creeps.length === 0 ||
    creeps.every((c) =>
      c.body
        .filter((b) => {
          return b.type === WORK;
        })
        .every((b) => !!b.boost),
    )
  );
}

function generateStrategy(room: Room, strategy: AllMinerals[]): AllMinerals[] {
  const last = _.last(strategy);

  // 末尾が取れないのはなんか変なのでいったん返す
  if (!last) {
    return strategy;
  }

  const roomResouces = getRoomResouces(room);

  // 足りてるときはそのまま返す
  if ((roomResouces[last] || 0) > 1000) {
    return strategy;
  }

  const reverseReactions = REVERSE_REACTIONS[last];

  // 逆反応が取れないのは原料なのでそのまま返す
  if (!reverseReactions) {
    return strategy;
  }

  const [left, right] = reverseReactions;
  if (!isCompound(left) && !isCompound(right)) {
    // 両方原料まで行っちゃったときはそれで終わる
    return strategy.concat(right, left);
  }
  const labs = getLabs(room);
  // Gで3ラボが3この時はスタックしちゃうので特殊処理を入れる
  if (labs.size() <= 3 && last === RESOURCE_GHODIUM && (roomResouces[left] || 0) >= 1000 && (roomResouces[right] || 0) < 1000) {
    // 左が足りてて右が足らないとき左を足さない
    return generateStrategy(room, strategy.concat(right));
  }

  return generateStrategy(room, generateStrategy(room, strategy.concat(right)).concat(left));
}

export function getManagerBody(room: Room): BodyPartConstant[] {
  const safetyFactor = 2;

  const bodyCycle: BodyPartConstant[] = [MOVE, CARRY, CARRY];
  let costTotal = 0;
  const avgSize = room.memory.carrySize?.labManager || 100;
  // 個数 (÷50の切り上げ)
  // 安全係数
  // の２倍(CARRY,MOVE)
  return _.range(Math.ceil(avgSize / CARRY_CAPACITY) * safetyFactor * 3)
    .slice(0, 50)
    .map((i) => {
      const parts = bodyCycle[i % bodyCycle.length];
      costTotal += BODYPART_COST[parts];
      return { parts, costTotal };
    })
    .filter((p) => p.costTotal <= room.energyAvailable)
    .map((p) => p.parts);
}
