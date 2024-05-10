import { filterBodiesByCost, getCreepsInRoom, getSpawnsInRoom } from "./util.creep";

export function behavior(source: Source) {
  // 自分用のdistributerを管理する
  const distributerName = `D_${source.pos.x}_${source.pos.y}`;
  const creeps = getCreepsInRoom(source.room).filter((c) => c.name === distributerName);

  // 居なければ作る
  if (creeps.length === 0) {
    const spawn = _(getSpawnsInRoom(source.room))
      .filter((s) => !s.spawning)
      .first();
    if (!spawn) {
      return ERR_NOT_FOUND;
    }

    if (source.room.energyAvailable > 150) {
      const { bodies, cost } = filterBodiesByCost("distributer", source.room.energyAvailable);
      if (
        spawn.spawnCreep(bodies, distributerName, {
          memory: {
            mode: "🛒",
            role: "distributer",
            sourceId: source.id,
          } as DistributerMemory,
        }) == OK
      ) {
        source.room.memory.energySummary?.push({
          consumes: cost,
          production: 0,
        });
        return OK;
      }
    } else {
      return ERR_NOT_ENOUGH_ENERGY;
    }
  }
  return OK;
}
