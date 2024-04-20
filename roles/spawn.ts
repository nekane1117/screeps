import _ from "lodash";
import { HARVESTER_MIN_ENERGY } from "../const";
import { bodyMaker } from "../utils/creep";

const behavior = (spawn: StructureSpawn) => {
  const creeps = Object.entries(Game.creeps).map((e) => e[1]);
  // １匹もいないときはとにかく作る
  if (creeps.length === 0) {
    return spawn.spawnCreep(
      // とりあえず最小単位
      [MOVE, WORK, CARRY],
      generateCreepName(spawn, "harvester"),
      {
        memory: {
          role: "harvester",
        } as HarvesterMemory,
      },
    );
  }

  // 資源から2マス離れた所にコンテナを置く
  const sources = spawn.room.find(FIND_SOURCES);
  if (
    spawn.room.find(FIND_STRUCTURES, {
      filter: (s) => s.structureType === STRUCTURE_CONTAINER,
    }).length < sources.length
  ) {
    sources.forEach((s) => {
      const pathStep = s.pos.findPathTo(spawn.pos, {
        ignoreCreeps: true,
        swampCost: 1,
      })[1];
      if (pathStep) {
        spawn.room.createConstructionSite(
          pathStep.x,
          pathStep.y,
          STRUCTURE_CONTAINER,
        );
      }
    });
  }

  // harvesterが不足しているとき
  if (
    creeps.filter((c) => c.memory.role === "harvester").length <
      spawn.room.find(FIND_SOURCES).length * 2 &&
    spawn.store[RESOURCE_ENERGY] > HARVESTER_MIN_ENERGY
  ) {
    return spawn.spawnCreep(
      bodyMaker("harvester", spawn.store[RESOURCE_ENERGY]),
      generateCreepName(spawn, "harvester"),
      {
        memory: {
          role: "harvester",
        } as HarvesterMemory,
      },
    );
  }
  return OK;
};

const generateCreepName = (spawn: StructureSpawn, role: ROLES) => {
  const shortName: Record<ROLES, string> = {
    builder: "BLD",
    carrier: "CAR",
    defender: "DEF",
    harvester: "HAV",
    repairer: "REP",
  };

  return (
    _.range(100)
      .map((i) => `${spawn.room.name}_${shortName[role]}_${i}`)
      .find((name) => !Game.creeps[name]) || Game.time.toString()
  );
};

export default behavior;
