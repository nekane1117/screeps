import _ from "lodash";
import { MIN_BODY, bodyMaker, getBodyCost, getCreepsInRoom } from "./util.creep";

const behavior = (spawn: StructureSpawn) => {
  if (spawn.spawning) {
    return;
  }

  const creepsInRoom: _.Dictionary<Creep[] | undefined> = _(getCreepsInRoom(spawn.room))
    .map((name) => Game.creeps[name])
    .compact()
    .groupBy((c) => c.memory.role)
    .value();
  // １匹もいないときはとにかく作る
  if ((creepsInRoom.harvester || []).length === 0) {
    return spawn.spawnCreep(
      // とりあえず最小単位
      [MOVE, WORK, CARRY],
      generateCreepName("harvester"),
      {
        memory: {
          role: "harvester",
        } as HarvesterMemory,
      },
    );
  }

  // upgraderが居ないときもとりあえず作る
  if (
    (creepsInRoom.upgrader || []).length === 0 &&
    spawn.room.energyAvailable > Math.max(getBodyCost(MIN_BODY["upgrader"]), spawn.room.energyCapacityAvailable * 0.8)
  ) {
    return spawn.spawnCreep(bodyMaker("upgrader", spawn.room.energyAvailable), generateCreepName("upgrader"), {
      memory: {
        role: "upgrader",
      } as UpgraderMemory,
    });
  }

  // harvesterが不足しているとき
  if (
    (creepsInRoom.harvester || []).length < spawn.room.memory.harvesterLimit &&
    spawn.room.energyAvailable > Math.max(getBodyCost(MIN_BODY["harvester"]), spawn.room.energyCapacityAvailable * 0.8)
  ) {
    return spawn.spawnCreep(bodyMaker("harvester", spawn.room.energyAvailable), generateCreepName("harvester"), {
      memory: {
        role: "harvester",
      } as HarvesterMemory,
    });
  }
  // builderが不足しているとき
  if (
    spawn.room.find(FIND_MY_CONSTRUCTION_SITES).length && // 建設がある
    (creepsInRoom.builder || []).length === 0 &&
    spawn.room.energyAvailable > Math.max(getBodyCost(MIN_BODY["builder"]), spawn.room.energyCapacityAvailable * 0.8) // エネルギー余ってる
  ) {
    return spawn.spawnCreep(bodyMaker("builder", spawn.room.energyAvailable), generateCreepName("builder"), {
      memory: {
        role: "builder",
        mode: "working",
      } as BuilderMemory,
    });
  }

  // repairerが不足しているとき
  if (
    spawn.room.find(FIND_STRUCTURES, { filter: (s) => s.hits < s.hitsMax * 0.5 }).length && // 建設がある
    (creepsInRoom?.repairer || []).length === 0 &&
    spawn.room.energyAvailable > Math.max(getBodyCost(MIN_BODY["repairer"]), spawn.room.energyCapacityAvailable * 0.8) // エネルギー余ってる
  ) {
    return spawn.spawnCreep(bodyMaker("repairer", spawn.room.energyAvailable), generateCreepName("repairer"), {
      memory: {
        role: "repairer",
        mode: "working",
      } as RepairerMemory,
    });
  }

  return OK;
};

const generateCreepName = (role: ROLES) => {
  const shortName: Record<ROLES, string> = {
    builder: "B",
    carrier: "C",
    defender: "D",
    harvester: "G", // gatherer
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
