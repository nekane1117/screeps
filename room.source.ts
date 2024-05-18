import { filterBodiesByCost, getCreepsInRoom, getMainSpawn, squareDiff } from "./util.creep";

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
    getCreepsInRoom(source.room).filter((c: Creeps | undefined): c is Harvester => {
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
    if (source.room.energyAvailable > 200) {
      for (const n of _.range(memory.positions)) {
        const name = `H_${source.id}_${n}`;
        if (Game.creeps[name]) {
          continue;
        }
        const spawn = getMainSpawn(source.room);
        if (!spawn) {
          return ERR_NOT_FOUND;
        }

        const { bodies, cost } = filterBodiesByCost("harvester", spawn.room.energyAvailable);
        const spawned = spawn.spawnCreep(bodies, name, {
          memory: {
            role: "harvester",
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
