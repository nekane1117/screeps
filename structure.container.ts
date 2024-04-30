import { bodyMaker } from "./util.creep";

export default function containerBehavior(structure: Structure) {
  // 取れないやつが来た時は消して終了
  if (!isTarget(structure)) {
    return console.log(`${structure.id} is not container(${structure.structureType})`);
  }

  return _.range(3).map((n) => {
    const carrierName = `C_${structure.pos.x}_${structure.pos.y}_${n}`;

    // Creepが無ければSpawnを探す
    if (!Game.creeps[carrierName]) {
      const spawn = structure.room
        .find(FIND_STRUCTURES, {
          filter: (s): s is StructureSpawn => s.structureType === STRUCTURE_SPAWN,
        })
        .find((spawn) => !spawn.spawning);
      // 使えるSpawnがあったときは作る
      if (spawn && spawn.room.energyAvailable > spawn.room.energyCapacityAvailable * 0.5) {
        return spawn.spawnCreep(bodyMaker("carrier", spawn.room.energyAvailable), carrierName, {
          memory: {
            role: "carrier",
            storeId: structure.id,
          } as CarrierMemory,
        });
      } else {
        return ERR_NOT_FOUND;
      }
    } else {
      return OK;
    }
  });
}

function isTarget(s: Structure): s is StructureContainer {
  return s.structureType === STRUCTURE_CONTAINER;
}
