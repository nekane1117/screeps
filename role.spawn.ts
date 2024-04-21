import _ from "lodash";
import { MIN_BODY, bodyMaker, getBodyCost } from "./util.creep";

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
    spawn.room.energyAvailable > getBodyCost(MIN_BODY["upgrader"])
  ) {
    return spawn.spawnCreep(
      bodyMaker("upgrader", spawn.room.energyAvailable),
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
    spawn.room.energyAvailable >
      Math.max(
        getBodyCost(MIN_BODY["harvester"]),
        spawn.room.energyCapacityAvailable * 0.6,
      )
  ) {
    return spawn.spawnCreep(
      bodyMaker("harvester", spawn.room.energyAvailable),
      generateCreepName(spawn, "harvester"),
      {
        memory: {
          role: "harvester",
        } as HarvesterMemory,
      },
    );
  }
  // builderが不足しているとき
  if (
    // 建設がある
    spawn.room.find(FIND_MY_CONSTRUCTION_SITES).length &&
    // builder足らない(適当に最大４とする)
    creepsInRoom.filter((c) => c.memory.role === "builder").length < 4 &&
    spawn.room.energyAvailable >
      Math.max(
        getBodyCost(MIN_BODY["builder"]),
        spawn.room.energyCapacityAvailable * 0.8,
      )
  ) {
    return spawn.spawnCreep(
      bodyMaker("builder", spawn.room.energyAvailable),
      generateCreepName(spawn, "builder"),
      {
        memory: {
          role: "builder",
        } as BuilderMemory,
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
