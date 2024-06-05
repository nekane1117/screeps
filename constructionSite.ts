import { filterBodiesByCost } from "./util.creep";
import { getSpawnsInRoom, getSpawnsWithDistance } from "./utils";

export default function behavior(site: ConstructionSite) {
  // builderが居ないときは要求する
  if (!site.room) {
    return;
  }

  const bodies = filterBodiesByCost("builder", site.room.energyAvailable).bodies;
  if (
    Object.values(Game.creeps).filter((c): c is Builder => {
      return c.memory.role === "builder" && c.memory.baseRoom === site.pos.roomName && (c.ticksToLive || 0) > bodies.length * CREEP_SPAWN_TIME;
    }).length < 1
  ) {
    // 隣の部屋までの使えるspawnを探す
    const spawn = (() => {
      const inRoom = _(getSpawnsInRoom(site.room));
      if (inRoom.size() > 0) {
        return inRoom.filter((s) => !s.spawning && s.room.energyAvailable === s.room.energyCapacityAvailable).first();
      } else {
        return getSpawnsWithDistance(site)
          .filter((s) => s.spawn.room.energyAvailable === s.spawn.room.energyCapacityAvailable)
          .sortBy((r) => r.spawn.room.energyAvailable / (r.distance + 1) ** 2)
          .first()?.spawn;
      }
    })();
    if (spawn) {
      spawn.spawnCreep(filterBodiesByCost("builder", spawn.room.energyAvailable).bodies, `B_${site.pos.roomName}_${Game.time}`, {
        memory: {
          role: "builder",
          baseRoom: site.pos.roomName,
          mode: "🛒",
        } as BuilderMemory,
      });
    }
  }
}
