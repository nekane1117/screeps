import _ from "lodash";
import { filterBodiesByCost, getCreepsInRoom } from "./util.creep";
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
  const sitesInRoom = Object.values(Game.constructionSites).filter((s) => s.room?.name === spawn.room.name);

  const upgradeContainer = spawn.room.controller?.pos.findClosestByRange(FIND_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_CONTAINER });
  const upgradeContainerRate = upgradeContainer ? getCapacityRate(upgradeContainer) : 0;

  // upgraderが居ないときもとりあえず作る
  if (
    sitesInRoom.length === 0 &&
    (creepsInRoom.upgrader || []).length < upgradeContainerRate / 0.9 &&
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
        time: new Date().valueOf(),
        consumes: cost,
        production: 0,
      });
    }
    return spawned;
  }

  // builderが不足しているとき
  if (
    sitesInRoom.length && // 建設がある
    (creepsInRoom.builder || []).length < upgradeContainerRate / 0.9 &&
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
        time: new Date().valueOf(),
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
        time: new Date().valueOf(),
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
