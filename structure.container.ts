import { bodyMaker } from "./util.creep";

export default function containerBehavior(structure: Structure) {
  // 取れないやつが来た時は消して終了
  if (!isTarget(structure)) {
    return console.log(`${structure.id} is not container(${structure.structureType})`);
  }

  const clothestSpawn = structure.pos.findClosestByRange(Object.values(Game.spawns));

  if (clothestSpawn) {
    // 最寄りのSpawnにより近い倉庫の中で一番近いやつ
    const innerClothestStorage = structure.pos.findClosestByRange(
      clothestSpawn.pos.findInRange(FIND_STRUCTURES, clothestSpawn.pos.getRangeTo(structure) - 1, {
        filter: (s): s is StructureContainer | StructureStorage => [STRUCTURE_CONTAINER, STRUCTURE_STORAGE].some((t) => t === s.structureType),
      }),
    );
    // との容量差分の割合の4倍(100:0で4 , 全く同じで0)
    return _.range(Math.ceil((Math.max(0, structure.store.energy - (innerClothestStorage?.store.energy || 0)) * 4) / CONTAINER_CAPACITY)).map((n) => {
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
}

function isTarget(s: Structure): s is StructureContainer {
  return s.structureType === STRUCTURE_CONTAINER;
}
