import { filterBodiesByCost } from "./util.creep";
import { getSpawnsWithDistance } from "./utils";

export default function behavior(site: ConstructionSite) {
  // builderが居ないときは要求する
  if (
    Object.values(Game.creeps).filter((c): c is Builder => {
      return c.memory.role === "builder" && c.memory.baseRoom === site.pos.roomName && (c.ticksToLive || 0) > CREEP_LIFE_TIME * 0.1;
    }).length < 2
  ) {
    // 隣の部屋までの使えるspawnを探す
    const spawn = getSpawnsWithDistance(site)
      .sort((a, b) => b.spawn.room.energyAvailable / (b.distance + 1) - a.spawn.room.energyAvailable / (a.distance + 1))
      .find(
        ({
          spawn: {
            room: { energyAvailable, energyCapacityAvailable },
          },
        }) => energyAvailable / energyCapacityAvailable > 0.9,
      )?.spawn;
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
