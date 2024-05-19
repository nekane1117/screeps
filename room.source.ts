import { filterBodiesByCost, squareDiff } from "./util.creep";
import { getSpawnsOrderdByRange } from "./utils";

export function behavior(source: Source) {
  // メモリを初期化する
  // 適当に100ティックごとに再確認する
  if (!source.room.memory?.sources?.[source.id] || Game.time % 100 === 0) {
    source.room.memory.sources = source.room.memory.sources || {};
    source.room.memory.sources[source.id] = initMemory(source);
  }

  const memory = _.cloneDeep(source.room.memory.sources[source.id]) as Readonly<SourceMemory>;

  // 自分用のharvesterのlodash wrapper
  const harvesters = _(
    Object.values(Game.creeps).filter((c: Creeps | undefined): c is Harvester => {
      // 自分用のharvester
      const isH = (c: Creeps): c is Harvester => {
        return c.memory.role === "harvester";
      };
      return c !== undefined && isH(c) && c.memory.harvestTargetId === source.id;
    }),
  );

  // 最大匹数より少なく、WORKのパーツが5未満の時
  if (harvesters.size() < memory.positions && harvesters.map((c) => c.getActiveBodyparts(WORK)).sum() < 5) {
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
          baseRoom: spawn.room.name,
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

function initMemory(source: Source): SourceMemory {
  const terrain = source.room.getTerrain();
  return {
    positions: squareDiff
      .map(([dx, dy]) => {
        return terrain.get(source.pos.x + dx, source.pos.y + dy);
      })
      .filter((terrain) => terrain !== TERRAIN_MASK_WALL).length,
  };
}
