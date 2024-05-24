import { filterBodiesByCost, getMainSpawn } from "./util.creep";
import { findMyStructures, getSpawnsOrderdByRange } from "./utils";

export function behavior(source: Source) {
  // 最大匹数より少なく、WORKのパーツが5未満の時
  if (!Object.values(Game.creeps).find((c): c is Harvester => isH(c) && c.memory.harvestTargetId === source.id)) {
    // 自分用のWORKが5個以下の時
    const spawn = getSpawnsOrderdByRange(source, 1).first() || getSpawnsOrderdByRange(source).first();
    if (!spawn) {
      console.log(`source ${source.id} can't find spawn`);
      return ERR_NOT_FOUND;
    }

    if (spawn.room.energyAvailable > 200) {
      const name = `H_${source.room.name}_${Game.time}`;
      const spawned = spawn.spawnCreep(filterBodiesByCost("harvester", spawn.room.energyAvailable).bodies, name, {
        memory: {
          role: "harvester",
          baseRoom: source.room.name,
          harvestTargetId: source.id,
        } as HarvesterMemory,
      });
      return spawned;
    }
  }

  if (
    source.pos.findInRange(
      [
        ...findMyStructures(source.room).container,
        ...Object.values(Game.constructionSites).filter((s) => s.pos.roomName === source.pos.roomName && s.structureType === STRUCTURE_CONTAINER),
      ],
      1,
    ).length === 0
  ) {
    const spawn = getMainSpawn(source.room);
    if (spawn) {
      const pos = _(
        source.pos.findPathTo(spawn, {
          ignoreCreeps: true,
        }),
      ).first();
      pos && source.room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER);
    }
  }
  return OK;
}

function isH(c: Creeps): c is Harvester {
  return c.memory.role === "harvester";
}
