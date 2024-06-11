import { LAB_STRATEGY, REVERSE_REACTIONS } from "./constants";
import { getCarrierBody, getCreepsInRoom } from "./util.creep";
import { getSpawnsInRoom } from "./utils";

export default function behavior(labs: StructureLab[], mineral: Mineral) {
  const strategy = LAB_STRATEGY[mineral.mineralType];
  if (!strategy) {
    return console.log(mineral.mineralType, "not have strategy");
  }

  const firstLab = _.first(labs);

  if (!firstLab) {
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

  const bodies = getCarrierBody(firstLab.room, "labManager");

  // 管理者を作る
  if (
    firstLab.room.terminal &&
    firstLab.room.terminal.store.energy > firstLab.room.energyCapacityAvailable &&
    firstLab.room.energyAvailable === firstLab.room.energyCapacityAvailable &&
    labManager.filter((lm) => (lm.ticksToLive || Infinity) > bodies.length * CREEP_SPAWN_TIME).length === 0
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

  // メモリを埋め込んだLABの情報を作る
  const labWithMemory = labs.slice(0, strategy.length).map((lab, i) => {
    // メモリの取得ついでに初期化
    const memory =
      lab.room.memory.labs[lab.id] ||
      (lab.room.memory.labs[lab.id] = {
        expectedType: strategy[i],
      });

    // 破壊、再建を考慮して上書きする
    // (変わった時えらいことになるが一旦仕方ない)
    memory.expectedType = strategy[i];

    // 続きの処理のために埋め込む
    return Object.assign(lab, { memory }) as StructureLab & { memory: LabMemory };
  });

  // 計画の長さの分だけ処理する
  labWithMemory.map((lab) => {
    lab.room.visual.text(lab.memory.expectedType, lab.pos.x, lab.pos.y, {
      color: "#008800",
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
