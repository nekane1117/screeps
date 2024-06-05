import { filterBodiesByCost, getMainSpawn } from "./util.creep";
import { findMyStructures, getSpawnsInRoom } from "./utils";

export function behavior(source: Source) {
  const harvesters = Object.values(Game.creeps).filter((c): c is Harvester => {
    return isH(c) && c.memory.harvestTargetId === source.id && (c?.ticksToLive || 0) > filterBodiesByCost("harvester", 10000).bodies.length * CREEP_SPAWN_TIME;
  });

  // 最大匹数より少なく、WORKのパーツが5未満の時
  if (
    harvesters.length < 1 &&
    _(harvesters)
      .map((h) => h.getActiveBodyparts(WORK))
      .flatten()
      .sum() < 5
  ) {
    // 自分用のWORKが5個以下の時
    const spawn = (() => {
      const spawns = getSpawnsInRoom(source.room);
      // 部屋にある時は部屋のだけ
      if (spawns.length > 0) {
        return source.pos.findClosestByRange(spawns);
      } else {
        return source.pos.findClosestByPath(Object.values(Game.spawns));
      }
    })();
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
