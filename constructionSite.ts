import { filterBodiesByCost } from "./util.creep";
import { getSpawnsInRoom } from "./utils";

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
    const spawn = _(getSpawnsInRoom(site.room).filter((s) => !s.spawning)).first();
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
