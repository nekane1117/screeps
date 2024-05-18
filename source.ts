import { filterBodiesByCost, getCreepsInRoom, getSpawnsInRoom, squareDiff } from "./util.creep";
import { findMyStructures, getCapacityRate } from "./utils";

export function behavior(source: Source) {
  // メモリを初期化する
  // 適当に100ティックごとに再確認する
  if (!Memory.sources[source.id] || Game.time % 100 === 0) {
    Memory.sources[source.id] = initMemory(source);
  }

  const memory = _.cloneDeep(Memory.sources[source.id]) as Readonly<SourceMemory>;

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
        const name = `H_${source.pos.x}_${source.pos.y}_${n}`;
        if (Game.creeps[name]) {
          continue;
        }
        const spawn = _(getSpawnsInRoom(source.room))
          .filter((s) => !s.spawning)
          .first();
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

  // 自分用のdistributerを管理する
  for (const n of _.range(
    source.pos.findInRange(findMyStructures(source.room).container, 3, { filter: (s: StructureContainer) => getCapacityRate(s) > 0 }).length,
  )) {
    const name = `D_${source.pos.x}_${source.pos.y}_${n}`;
    const creeps = Game.creeps[name];

    // 居なければ作る
    if (!creeps) {
      const spawn = _(getSpawnsInRoom(source.room))
        .filter((s) => !s.spawning)
        .first();
      if (!spawn) {
        return ERR_NOT_FOUND;
      }

      if (source.room.energyAvailable > 150) {
        const { bodies, cost } = filterBodiesByCost("distributer", source.room.energyAvailable);
        if (
          spawn.spawnCreep(bodies, name, {
            memory: {
              mode: "🛒",
              role: "distributer",
              sourceId: source.id,
            } as DistributerMemory,
          }) == OK
        ) {
          source.room.memory.energySummary?.push({
            time: new Date().valueOf(),
            consumes: cost,
            production: 0,
          });
          return OK;
        }
      } else {
        return ERR_NOT_ENOUGH_ENERGY;
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
