import _ from "lodash";
import { MIN_BODY, bodyMaker, getBodyCost, getCreepsInRoom, squareDiff } from "./util.creep";

const behavior = (spawn: StructureSpawn) => {
  if (spawn.spawning) {
    return;
  }

  const creepsInRoom: _.Dictionary<Creep[] | undefined> = _(getCreepsInRoom(spawn.room))
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

  // harvester
  if (spawn.room.energyAvailable >= 200) {
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
        return spawn.spawnCreep(bodyMaker("harvester", spawn.room.energyAvailable), generateCreepName("harvester"), {
          memory: {
            role: "harvester",
            harvestTargetId: source.id,
          } as HarvesterMemory,
        });
      }
    }
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

  // 満たされてるコンテナの数
  const filledStorages = spawn.room.find(FIND_STRUCTURES, {
    filter: (s) => {
      // コンテナかstorage
      return [STRUCTURE_CONTAINER, STRUCTURE_STORAGE].some((t) => {
        return s.structureType === t && s.store.getUsedCapacity(RESOURCE_ENERGY) / s.store.getCapacity(RESOURCE_ENERGY) > 0.5;
      });
    },
  });

  // builderが不足しているとき
  if (
    spawn.room.find(FIND_MY_CONSTRUCTION_SITES).length && // 建設がある
    (creepsInRoom.builder || []).length < (filledStorages.length || 1) &&
    spawn.room.energyAvailable > Math.max(getBodyCost(MIN_BODY["builder"]), spawn.room.energyCapacityAvailable * 0.8) // エネルギー余ってる
  ) {
    return spawn.spawnCreep(bodyMaker("builder", spawn.room.energyAvailable), generateCreepName("builder"), {
      memory: {
        role: "builder",
        mode: "💪",
      } as BuilderMemory,
    });
  }

  // repairerが不足しているとき
  if (
    spawn.room.find(FIND_STRUCTURES, { filter: (s) => s.structureType !== STRUCTURE_WALL && s.hits < s.hitsMax * 0.5 }).length && // 建設がある
    (creepsInRoom?.repairer || []).length < filledStorages.length &&
    spawn.room.energyAvailable > Math.max(getBodyCost(MIN_BODY["repairer"]), spawn.room.energyCapacityAvailable * 0.8) // エネルギー余ってる
  ) {
    return spawn.spawnCreep(bodyMaker("repairer", spawn.room.energyAvailable), generateCreepName("repairer"), {
      memory: {
        role: "repairer",
        mode: "💪",
      } as RepairerMemory,
    });
  }

  // upgraderが居ないときもとりあえず作る
  if (
    (creepsInRoom.upgrader || []).length < filledStorages.length &&
    spawn.room.energyAvailable > Math.max(getBodyCost(MIN_BODY["upgrader"]), spawn.room.energyCapacityAvailable * 0.8)
  ) {
    return spawn.spawnCreep(bodyMaker("upgrader", spawn.room.energyAvailable), generateCreepName("upgrader"), {
      memory: {
        role: "upgrader",
      } as UpgraderMemory,
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
