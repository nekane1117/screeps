import { filterBodiesByCost } from "./util.creep";

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
    // との容量差分の割合の2倍(100:0で2 , 全く同じで0)
    const requests = Math.min(2, Math.ceil(Math.max(1, (structure.store.energy - (innerClothestStorage?.store.energy || 0)) * 2) / CONTAINER_CAPACITY));

    new RoomVisual(structure.room.name).text(requests.toString(), structure.pos);
    return _.range(requests).map((n) => {
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
          return spawn.spawnCreep(filterBodiesByCost("carrier", spawn.room.energyAvailable), carrierName, {
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

function isTarget(s: Structure): s is StructureContainer | StructureStorage | StructureLink {
  return ([STRUCTURE_CONTAINER, STRUCTURE_STORAGE, STRUCTURE_LINK] as StructureConstant[]).includes(s.structureType);
}
