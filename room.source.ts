import { filterBodiesByCost, getCreepsInRoom, getMainSpawn } from "./util.creep";
import { findMyStructures, getSpawnsInRoom } from "./utils";

export function behavior(source: Source) {
  const harvesters = getCreepsInRoom(source.room).harvester || [];
  const myH = harvesters.filter((h) => h.memory?.harvestTargetId === source.id);
  if (myH.length < 1) {
    const spawn = (() => {
      const spawns = getSpawnsInRoom(source.room);
      // 部屋にある時は部屋のだけ
      if (spawns.length > 0) {
        return source.pos.findClosestByRange(spawns.filter((s) => !s.spawning));
      } else {
        return source.pos.findClosestByPath(Object.values(Game.spawns));
      }
    })();
    if (!spawn) {
      console.log(`source ${source.id} can't find spawn`);
      return ERR_NOT_FOUND;
    }

    if (harvesters.length > 0 ? spawn.room.energyAvailable >= spawn.room.energyCapacityAvailable : spawn.room.energyAvailable >= 300) {
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
  } else if (myH.length > 1) {
    _(myH)
      .sortBy((c) => c.ticksToLive || Infinity)
      .reverse()
      .tail()
      .forEach((c) => c.suicide())
      .run();
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
