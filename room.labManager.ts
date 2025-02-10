import { LAB_STRATEGY, REVERSE_REACTIONS } from "./constants";
import { filterBodiesByCost, getCreepsInRoom } from "./util.creep";
import { findMyStructures, getSitesInRoom, getSpawnsInRoom } from "./utils";

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

  const strategy = _.clone(LAB_STRATEGY[room.memory.labMode]);
  if (!strategy) {
    console.log("strategy is not defined: " + room.memory.labMode);
    return ERR_INVALID_ARGS;
  }

  while (strategy.length > labs.length) {
    // 末尾３つすべてが1000以上
    if (strategy.slice(-3).every((r) => (getAllResouces(room)[r] || 0) > 1000)) {
      // 末尾を消す
      strategy.pop();
    } else {
      break;
    }
  }

  // メモリを埋め込んだLABの情報を作る
  const labWithMemory = labs.map((lab, i) => {
    const expectedType = strategy[strategy.length - labs.length - i];
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
    lab.room.visual.text(lab.memory.expectedType, lab.pos.x, lab.pos.y, {
      color: "#008800",
      font: 0.25,
    });

    const ingredients = REVERSE_REACTIONS[lab.memory.expectedType];
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

let allResouces: Partial<Record<ResourceConstant, number>> & {
  timestamp: number;
} = { timestamp: 0 };

function getAllResouces(room: Room) {
  allResouces = allResouces || { timestamp: Game.time };

  if (allResouces.timestamp === Game.time) {
    return allResouces;
  }
  const { factory } = findMyStructures(room);
  for (const storage of _.compact([room.storage, room.terminal, factory])) {
    for (const resource of RESOURCES_ALL) {
      allResouces[resource] = (allResouces[resource] || 0) + storage.store.getUsedCapacity(resource);
    }
  }
  return allResouces;
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
      // boostされてないWORKを持っているやつ
      return b.type === WORK && !b.boost;
    }),
  );
}
