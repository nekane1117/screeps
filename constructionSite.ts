import { filterBodiesByCost } from "./util.creep";
import { getSpawnsOrderdByRange } from "./utils";

export default function behavior(site: ConstructionSite) {
  // builderが居ないときは要求する
  if (
    Object.values(Game.creeps).filter((c): c is Builder => {
      return c.memory.role === "builder" && c.memory.baseRoom === site.pos.roomName && (c.ticksToLive || 0) > CREEP_LIFE_TIME * 0.1;
    }).length === 0
  ) {
    // 隣の部屋までの使えるspawnを探す
    const spawn = getSpawnsOrderdByRange(site, 1).find((s) => !s.spawning && s.room.energyAvailable / s.room.energyCapacityAvailable > 0.9);

    if (spawn) {
      const { bodies, cost } = filterBodiesByCost("builder", spawn.room.energyAvailable);
      if (
        spawn.spawnCreep(bodies, `B_${site.pos.roomName}`, {
          memory: {
            role: "builder",
            baseRoom: site.pos.roomName,
            mode: "🛒",
          } as BuilderMemory,
        }) === OK
      ) {
        spawn.room.memory.energySummary?.push({
          consumes: cost,
          production: 0,
          time: new Date().valueOf(),
        });
      }
    }
  }
}
