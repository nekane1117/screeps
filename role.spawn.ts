import _ from "lodash";
import { HARVESTER_MIN_COST, UPGRADER_MIN_COST } from "./const";
import { bodyMaker } from "./util.creep";

const behavior = (spawn: StructureSpawn) => {
  if (spawn.spawning) {
    return;
  }
  const creepsInRoom = Object.entries(Game.creeps)
    .map((e) => e[1])
    .filter((c) => c.room.name === spawn.room.name);
  // １匹もいないときはとにかく作る
  if (creepsInRoom.length === 0) {
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

  // upgraderが居ないときもとりあえず作る
  if (
    creepsInRoom.filter((c) => c.memory.role === "upgrader").length === 0 &&
    spawn.store[RESOURCE_ENERGY] > UPGRADER_MIN_COST
  ) {
    return spawn.spawnCreep(
      bodyMaker("upgrader", spawn.store[RESOURCE_ENERGY]),
      generateCreepName(spawn, "upgrader"),
      {
        memory: {
          role: "upgrader",
        } as UpgraderMemory,
      },
    );
  }

  // harvesterが不足しているとき
  if (
    creepsInRoom.filter((c) => c.memory.role === "harvester").length <
      spawn.room.find(FIND_SOURCES).length * 2 &&
    spawn.store[RESOURCE_ENERGY] > HARVESTER_MIN_COST
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
    upgrader: "UPG",
  };

  return (
    _.range(100)
      .map((i) => `${spawn.room.name}_${shortName[role]}_${i}`)
      .find((name) => !Game.creeps[name]) || Game.time.toString()
  );
};

export default behavior;
