import { filterBodiesByCost } from "./util.creep";
import { getSpawnsOrderdByRange } from "./utils";

export function behavior(source: Source) {
  // 最大匹数より少なく、WORKのパーツが5未満の時
  if (!Object.values(Game.creeps).find((c): c is Harvester => isH(c) && c.memory.harvestTargetId === source.id)) {
    // 自分用のWORKが5個以下の時
    const spawn = getSpawnsOrderdByRange(source, 1).first();
    if (!spawn) {
      console.log(`source ${source.id} can't find spawn`);
      return ERR_NOT_FOUND;
    }

    if (spawn.room.energyAvailable > 200) {
      const name = `H_${source.room.name}_${Game.time}`;
      const { bodies, cost } = filterBodiesByCost("harvester", spawn.room.energyAvailable);
      const spawned = spawn.spawnCreep(bodies, name, {
        memory: {
          role: "harvester",
          baseRoom: source.room.name,
          harvestTargetId: source.id,
        } as HarvesterMemory,
      });
      if (spawned === OK && source.room.memory.energySummary) {
        source.room.memory.energySummary.push({
          time: Game.time,
          consumes: cost,
          production: 0,
        });
      }
      return spawned;
    }
  }
  return OK;
}

function isH(c: Creeps): c is Harvester {
  return c.memory.role === "harvester";
}
