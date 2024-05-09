import { filterBodiesByCost } from "./util.creep";

export default function containerBehavior(structure: Structure) {
  // 取れないやつが来た時は消して終了
  if (!isTarget(structure)) {
    return console.log(`${structure.id} is not container(${structure.structureType})`);
  }

  const clothestSpawn = structure.pos.findClosestByRange(Object.values(Game.spawns));

  if (clothestSpawn) {
    return _.range(1).map((n) => {
      const carrierName = `C_${structure.pos.x}_${structure.pos.y}_${n}`;

      // Creepが無ければSpawnを探す
      if (!Game.creeps[carrierName]) {
        const spawn = structure.room
          .find(FIND_STRUCTURES, {
            filter: (s): s is StructureSpawn => s.structureType === STRUCTURE_SPAWN,
          })
          .find((spawn) => !spawn.spawning);
        // 使えるSpawnがあったときは作る
        if (spawn && spawn.room.energyAvailable > spawn.room.energyCapacityAvailable * 0.6) {
          const { bodies, cost } = filterBodiesByCost("carrier", spawn.room.energyAvailable);
          const spawned = spawn.spawnCreep(bodies, carrierName, {
            memory: {
              role: "carrier",
              storeId: structure.id,
            } as CarrierMemory,
            energyStructures: _(
              structure.room.find(FIND_STRUCTURES, {
                filter: (s): s is StructureSpawn => s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION,
              }),
            )
              .sortBy((s) => s.pos.getRangeTo(spawn))
              .reverse()
              .run(),
          });
          if (spawned === OK && spawn.room.memory.energySummary) {
            spawn.room.memory.energySummary.push({
              consumes: cost,
              production: 0,
            });
          }
          return spawned;
        } else {
          return ERR_NOT_FOUND;
        }
      } else {
        return OK;
      }
    });
  }
}

function isTarget(s: Structure): s is StructureContainer | StructureStorage | StructureLink {
  return ([STRUCTURE_CONTAINER, STRUCTURE_STORAGE] as StructureConstant[]).includes(s.structureType);
}
