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
    const spawned = spawn.spawnCreep(bodies, `U_${Game.time}`, {
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
    (creepsInRoom.builder || []).length <
      Math.floor(
        _(creepsInRoom.harvester || [])
          .map((h) => h.getActiveBodyparts(WORK))
          .sum() / 5,
      ) &&
    spawn.room.energyAvailable > Math.max(200, spawn.room.energyCapacityAvailable * 0.6) // エネルギー余ってる
  ) {
    const { bodies, cost } = filterBodiesByCost("builder", spawn.room.energyAvailable);
    const spawned = spawn.spawnCreep(bodies, `B_${spawn.room.name}_${Game.time}`, {
      memory: {
        role: "builder",
        mode: "💪",
        parentRoom: spawn.room.name,
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

  return OK;
};

export default behavior;
