import { bodyMaker } from "./util.creep";

export default function containerBehavior(structure: Structure) {
  // 取れないやつが来た時は消して終了
  if (!isTarget(structure)) {
    return console.log(`${structure.id} is not container(${structure.structureType})`);
  }

  // 自分用のメモリを初期化する
  if (!structure.room.memory.containers[structure.id] || !structure.room.memory.containers[structure.id]?.carrierName) {
    structure.room.memory.containers[structure.id] = {
      carrierName: `C_${structure.pos.x.toString().padStart(2, "0")}_${structure.pos.y.toString().padStart(2, "0")}`,
    };
  }

  const carrierName = structure.room.memory.containers[structure.id]?.carrierName;
  if (carrierName) {
    // Creepが無ければSpawnを探す
    if (!Game.creeps[carrierName]) {
      const spawn = structure.room
        .find(FIND_STRUCTURES, {
          filter: (s): s is StructureSpawn => s.structureType === STRUCTURE_SPAWN,
        })
        .find((spawn) => !spawn.spawning);
      // 使えるSpawnがあったときは作る
      if (spawn && spawn.room.energyAvailable > spawn.room.energyCapacityAvailable * 0.5) {
        spawn.spawnCreep(bodyMaker("carrier", spawn.room.energyAvailable), carrierName, {
          memory: {
            role: "carrier",
            storeId: structure.id,
          } as CarrierMemory,
        });
      }
    }
  } else {
    // メモリが見つからなければ終了
    return;
  }
}

function isTarget(s: Structure): s is StructureContainer {
  return s.structureType === STRUCTURE_CONTAINER;
}
