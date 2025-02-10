import { LAB_STRATEGY, REVERSE_REACTIONS } from "./constants";
import { filterBodiesByCost, getCreepsInRoom } from "./util.creep";
import { findMyStructures, getSitesInRoom, getSpawnsInRoom, isCompound } from "./utils";

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

  const bodies = filterBodiesByCost("labManager", firstLab.room.energyAvailable).bodies;

  // 管理者を作る
  if (
    firstLab.room.terminal &&
    firstLab.room.terminal.store.energy > firstLab.room.energyCapacityAvailable &&
    firstLab.room.energyAvailable === firstLab.room.energyCapacityAvailable &&
    labManager.length === 0
  ) {
    const spawn = getSpawnsInRoom(firstLab.pos.roomName)?.find((s) => !s.spawning);
    if (spawn) {
      spawn.spawnCreep(bodies, `Lm_${firstLab.room.name}_${Game.time}`, {
        memory: {
          baseRoom: firstLab.room.name,
          mode: "🛒",
          role: "labManager",
        } as LabManagerMemory,
      });
    }
  }

  // モードチェック
  room.memory.labMode = checkMode(room);

  const finalProducts = _.clone(LAB_STRATEGY[room.memory.labMode]);
  if (!finalProducts) {
    console.log("strategy is not defined: " + room.memory.labMode);
    return ERR_INVALID_ARGS;
  }

  const strategy = generateStrategy(room, [finalProducts]);
  // メモリを埋め込んだLABの情報を作る
  const labWithMemory = labs.map((lab, i) => {
    const expectedType = strategy[strategy.length - labs.length + i];
    // メモリの取得ついでに初期化
    const memory = lab.room.memory.labs[lab.id] || (lab.room.memory.labs[lab.id] = { expectedType });

    // 破壊、再建を考慮して上書きする
    // (変わった時えらいことになるが一旦仕方ない)
    memory.expectedType = expectedType;

    // 続きの処理のために埋め込む
    return Object.assign(lab, { memory }) as StructureLab & { memory: LabMemory };
  });

  // 計画の長さの分だけ処理する
  labWithMemory.map((lab) => {
    lab.memory.expectedType &&
      lab.room.visual.text(lab.memory.expectedType, lab.pos.x, lab.pos.y, {
        color: "#008800",
        font: 0.25,
      });

    const ingredients = lab.memory.expectedType && REVERSE_REACTIONS[lab.memory.expectedType];
    // 要求通りのタイプを持っていて素材リストを持っている
    if ((!lab.mineralType || lab.mineralType === lab.memory.expectedType) && ingredients) {
      const [l1, l2] = ingredients.map((type) => {
        return labWithMemory.find((l) => {
          // 素材を要求していて
          // 要求通りのタイプを持っている
          return l.memory.expectedType === type && l.mineralType === l.memory.expectedType;
        });
      });
      if (l1 && l2) {
        lab.runReaction(l1, l2);
      }
    }
    return;
  });
}

let allResouces: Partial<
  Record<
    string,
    Partial<Record<ResourceConstant, number>> & {
      timestamp: number;
    }
  >
> = {};

function getRoomResouces(room: Room) {
  allResouces = allResouces || {};
  const roomResouces = (allResouces[room.name] = allResouces[room.name] || {
    timestamp: Game.time,
  });

  if (roomResouces.timestamp === Game.time) {
    return roomResouces;
  }
  const { factory } = findMyStructures(room);
  for (const storage of _.compact([room.storage, room.terminal, factory])) {
    for (const resource of RESOURCES_ALL) {
      roomResouces[resource] = (roomResouces[resource] || 0) + storage.store.getUsedCapacity(resource);
    }
  }
  return roomResouces;
}

function checkMode(room: Room) {
  const { builder = [], mineralHarvester = [] } = getCreepsInRoom(room);

  if (isUnBoosted(mineralHarvester)) {
    return "mineralHarvester";
  } else if (getSitesInRoom(room).length > 0 && isUnBoosted(builder)) {
    return "builder";
  } else {
    return "upgrader";
  }
}

function isUnBoosted(creeps: Creeps[]) {
  return creeps.find((c) =>
    c.body.find((b) => {
      if (b.type !== WORK) {
        return false;
      }
      switch (c.memory.role) {
        case "builder":
          return b.boost === RESOURCE_CATALYZED_LEMERGIUM_ACID || b.boost === RESOURCE_LEMERGIUM_ACID;
        case "mineralHarvester":
          return b.boost === RESOURCE_CATALYZED_UTRIUM_ALKALIDE || b.boost === RESOURCE_UTRIUM_ALKALIDE;
        case "upgrader":
          return b.boost === RESOURCE_CATALYZED_GHODIUM_ACID || b.boost === RESOURCE_GHODIUM_ACID;
        default:
          return false;
      }
    }),
  );
}

function generateStrategy(room: Room, strategy: AllMinerals[]): AllMinerals[] {
  const roomResouces = getRoomResouces(room);
  const last = _.last(strategy);

  // 末尾が取れないのはなんか変なのでいったん返す
  if (!last) {
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
    return strategy.concat(left, right);
  }

  if ((roomResouces[left] || 0) < 1000) {
    // 左側が足りないとき
    // 左側を足して再起する
    return generateStrategy(room, strategy.concat(left));
  } else if ((roomResouces[right] || 0) < 1000) {
    // 左が足りてるが右が足らないとき
    // 左、右の順で足して再帰する
    return generateStrategy(room, strategy.concat(left, right));
  } else {
    // 両方足りてるときはそれで終わる
    return strategy.concat(left, right);
  }
}
