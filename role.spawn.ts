import _ from "lodash";
import { filterBodiesByCost, getCreepsInRoom, squareDiff } from "./util.creep";
import { getCapacityRate } from "./utils";

const behavior = (spawn: StructureSpawn) => {
  if (Object.keys(Game.spawns)?.[0] === spawn.name) {
    spawn.room.visual.text(`${spawn.room.energyAvailable}/${spawn.room.energyCapacityAvailable}`, spawn.pos.x + 1, spawn.pos.y - 1);
  }
  if (spawn.spawning) {
    return;
  }

  const creepsInRoom: _.Dictionary<Creep[] | undefined> = _(getCreepsInRoom(spawn.room))
    .groupBy((c) => c.memory.role)
    .value();
  // harvester
  if (spawn.room.energyAvailable >= 300) {
    for (const source of spawn.room.find(FIND_SOURCES)) {
      const terrain = spawn.room.getTerrain();

      // 最大何匹か
      const maxCount = _(squareDiff)
        .map(([dx, dy]: [number, number]) => {
          return terrain.get(source.pos.x + dx, source.pos.y + dy) !== TERRAIN_MASK_WALL ? 1 : 0;
        })
        .sum();

      // 自分用のharvesterのlodash wrapper
      const harvesters = _(
        getCreepsInRoom(spawn.room).filter((c: Creeps | undefined): c is Harvester => {
          // 自分用のharvester
          const isH = (c: Creeps): c is Harvester => {
            return c.memory.role === "harvester";
          };
          return c !== undefined && isH(c) && c.memory.harvestTargetId === source.id;
        }),
      );

      // 最大匹数より少なく、WORKのパーツが5未満の時
      if (harvesters.size() < maxCount && harvesters.map((c) => c.getActiveBodyparts(WORK)).sum() < 5) {
        // 自分用のWORKが5個以下の時
        const { bodies, cost } = filterBodiesByCost("harvester", spawn.room.energyAvailable);
        const spawned = spawn.spawnCreep(bodies, generateCreepName("harvester"), {
          memory: {
            role: "harvester",
            harvestTargetId: source.id,
          } as HarvesterMemory,
          energyStructures: _(
            spawn.room.find(FIND_STRUCTURES, {
              filter: (s): s is StructureSpawn => s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION,
            }),
          )
            .sortBy((s) => s.pos.getRangeTo(spawn))
            .reverse()
            .run(),
        });
        if (spawned === OK && spawn.room.memory.energySummary) {
          spawn.room.memory.energySummary.push({
            consumes: cost,
            production: 0,
          });
        }
        return spawned;
      }
    }
  }

  const upgradeContainer = spawn.room.controller?.pos.findClosestByRange(FIND_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_CONTAINER });
  const upgradeContainerRate = upgradeContainer ? getCapacityRate(upgradeContainer) : 0;

  // upgraderが居ないときもとりあえず作る
  if (
    (creepsInRoom.upgrader || []).length < Math.floor(1 + upgradeContainerRate) &&
    spawn.room.energyAvailable > Math.max(200, spawn.room.energyCapacityAvailable * 0.8)
  ) {
    const { bodies, cost } = filterBodiesByCost("upgrader", spawn.room.energyAvailable);
    const spawned = spawn.spawnCreep(bodies, generateCreepName("upgrader"), {
      memory: {
        role: "upgrader",
      } as UpgraderMemory,
    });
    if (spawned === OK && spawn.room.memory.energySummary) {
      spawn.room.memory.energySummary.push({
        consumes: cost,
        production: 0,
      });
    }
    return spawned;
  }

  // builderが不足しているとき
  if (
    spawn.room.find(FIND_MY_CONSTRUCTION_SITES).length && // 建設がある
    (creepsInRoom.builder || []).length < upgradeContainerRate / 0.5 &&
    spawn.room.energyAvailable > Math.max(200, spawn.room.energyCapacityAvailable * 0.6) // エネルギー余ってる
  ) {
    const { bodies, cost } = filterBodiesByCost("builder", spawn.room.energyAvailable);
    const spawned = spawn.spawnCreep(bodies, generateCreepName("builder"), {
      memory: {
        role: "builder",
        mode: "💪",
      } as BuilderMemory,
    });
    if (spawned === OK && spawn.room.memory.energySummary) {
      spawn.room.memory.energySummary.push({
        consumes: cost,
        production: 0,
      });
    }
    return spawned;
  }

  // repairerが不足しているとき
  if (
    spawn.room.find(FIND_STRUCTURES, { filter: (s) => s.structureType !== STRUCTURE_WALL && s.hits < s.hitsMax * 0.5 }).length && // 建設がある
    (creepsInRoom?.repairer || []).length < 1 &&
    spawn.room.energyAvailable > Math.max(200, spawn.room.energyCapacityAvailable * 0.9) // エネルギー余ってる
  ) {
    const { bodies, cost } = filterBodiesByCost("repairer", spawn.room.energyAvailable);
    const spawned = spawn.spawnCreep(bodies, generateCreepName("repairer"), {
      memory: {
        role: "repairer",
        mode: "💪",
      } as RepairerMemory,
    });
    if (spawned === OK && spawn.room.memory.energySummary) {
      spawn.room.memory.energySummary.push({
        consumes: cost,
        production: 0,
      });
    }
    return spawned;
  }

  return OK;
};

const generateCreepName = (role: ROLES) => {
  const shortName: Record<ROLES, string> = {
    builder: "B",
    gatherer: "G",
    distributer: "D",
    harvester: "H",
    repairer: "R",
    upgrader: "U",
  };

  return (
    _.range(100)
      .map((i) => `${shortName[role]}_${i}`)
      .find((name) => !Game.creeps[name]) || Game.time.toString()
  );
};

export default behavior;
