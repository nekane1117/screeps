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
      generateCreepName(spawn, "harvester"),
      {
        memory: {
          role: "harvester",
        } as HarvesterMemory,
      },
    );
  }

  // upgraderが居ないときもとりあえず作る
  if ((creepsInRoom.upgrader || []).length === 0 && spawn.room.energyAvailable > getBodyCost(MIN_BODY["upgrader"])) {
    return spawn.spawnCreep(bodyMaker("upgrader", spawn.room.energyAvailable), generateCreepName(spawn, "upgrader"), {
      memory: {
        role: "upgrader",
      } as UpgraderMemory,
    });
  }

  // harvesterが不足しているとき
  if (
    (creepsInRoom.harvester || []).length < spawn.room.memory.harvesterLimit &&
    spawn.room.energyAvailable > Math.max(getBodyCost(MIN_BODY["harvester"]), spawn.room.energyCapacityAvailable * 0.6)
  ) {
    return spawn.spawnCreep(bodyMaker("harvester", spawn.room.energyAvailable), generateCreepName(spawn, "harvester"), {
      memory: {
        role: "harvester",
      } as HarvesterMemory,
    });
  }
  // builderが不足しているとき
  if (
    spawn.room.find(FIND_MY_CONSTRUCTION_SITES).length && // 建設がある
    (creepsInRoom?.builder || []).length < spawn.room.memory.activeSource.length &&
    spawn.room.energyAvailable > Math.max(getBodyCost(MIN_BODY["builder"]), spawn.room.energyCapacityAvailable * 0.8) // エネルギー余ってる
  ) {
    return spawn.spawnCreep(bodyMaker("builder", spawn.room.energyAvailable), generateCreepName(spawn, "builder"), {
      memory: {
        role: "builder",
        mode: "working",
      } as BuilderMemory,
    });
  }

  // repairerが不足しているとき
  if (
    spawn.room.find(FIND_STRUCTURES, { filter: (s) => s.hits < s.hitsMax }).length && // 建設がある
    (creepsInRoom?.repairer || []).length === 0 &&
    spawn.room.energyAvailable > Math.max(getBodyCost(MIN_BODY["repairer"]), spawn.room.energyCapacityAvailable * 0.8) // エネルギー余ってる
  ) {
    return spawn.spawnCreep(bodyMaker("repairer", spawn.room.energyAvailable), generateCreepName(spawn, "repairer"), {
      memory: {
        role: "repairer",
        mode: "working",
      } as RepairerMemory,
    });
  }

  // 目いっぱいたまったらもっとアップグレードする
  if ((creepsInRoom.upgrader?.length || 0) < (spawn.room.controller?.level || 0) * 2 && spawn.room.energyAvailable > spawn.room.energyCapacityAvailable * 0.9) {
    return spawn.spawnCreep(bodyMaker("upgrader", spawn.room.energyAvailable), generateCreepName(spawn, "upgrader"), {
      memory: {
        role: "upgrader",
      } as UpgraderMemory,
    });
  }

  return OK;
};

const generateCreepName = (spawn: StructureSpawn, role: ROLES) => {
  const shortName: Record<ROLES, string> = {
    builder: "B",
    carrier: "C",
    defender: "D",
    harvester: "H",
    repairer: "R",
    upgrader: "U",
  };

  return (
    _.range(100)
      .map((i) => `${spawn.room.name}_${shortName[role]}_${i}`)
      .find((name) => !Game.creeps[name]) || Game.time.toString()
  );
};

export default behavior;
