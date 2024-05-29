import { filterBodiesByCost, getMainSpawn, squareDiff } from "./util.creep";
import { findMyStructures, getSpawnsWithDistance } from "./utils";

export function behavior(source: Source) {
  const positions = squareDiff.filter(([x, y]) => {
    return source.room
      .getPositionAt(source.pos.x + x, source.pos.y + y)
      ?.lookFor(LOOK_TERRAIN)
      .find((t) => t !== "wall");
  }).length;

  const harvesters = Object.values(Game.creeps).filter((c): c is Harvester => {
    return isH(c) && c.memory.harvestTargetId === source.id && (c?.ticksToLive || 0) > filterBodiesByCost("harvester", 10000).bodies.length * CREEP_SPAWN_TIME;
  });

  // 最大匹数より少なく、WORKのパーツが5未満の時
  if (
    harvesters.length < positions &&
    _(harvesters)
      .map((h) => h.getActiveBodyparts(WORK))
      .flatten()
      .sum() < 5
  ) {
    // 自分用のWORKが5個以下の時
    const spawn = getSpawnsWithDistance(source)
      .sort((a, b) => {
        return b.spawn.room.energyAvailable / Math.max(b.distance, 1) - a.spawn.room.energyAvailable / Math.max(a.distance, 1);
      })
      .first()?.spawn;
    if (!spawn) {
      console.log(`source ${source.id} can't find spawn`);
      return ERR_NOT_FOUND;
    }

    if (spawn.room.energyAvailable >= 300) {
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
