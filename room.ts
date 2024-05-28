import { behavior } from "./room.source";
import linkBehavior from "./structure.links";
import { filterBodiesByCost, getMainSpawn, getRepairTarget } from "./util.creep";
import { findMyStructures } from "./utils";

export function roomBehavior(room: Room) {
  // Roomとしてやっておくこと

  if (room.find(FIND_HOSTILE_CREEPS).length && !room.controller?.safeMode && room.energyAvailable > SAFE_MODE_COST) {
    room.controller?.activateSafeMode();
  }

  room.find(FIND_SOURCES).forEach((source) => behavior(source));

  // 道を敷く
  if (!room.memory.roadLayed || Math.abs(Game.time - room.memory.roadLayed) > 5000) {
    console.log("roadLayer in " + Game.time);
    roadLayer(room);
  }

  // エクステンション建てる
  if (Game.time % 100 === 0) {
    creteStructures(room);
  }

  // linkの挙動
  linkBehavior(findMyStructures(room).link);

  //spawn
  const {
    carrier: carriers,
    harvester,
    repairer,
  } = Object.values(Game.creeps)
    .filter((c) => c.memory.baseRoom === room.name)
    .reduce(
      (creeps, c) => {
        creeps[c.memory.role] = (creeps?.[c.memory.role] || []).concat(c);
        return creeps;
      },
      { builder: [], claimer: [], carrier: [], harvester: [], upgrader: [], mineralHarvester: [], repairer: [], mineralCarrier: [] } as Record<ROLES, Creep[]>,
    );

  const { bodies: carrierBodies } = filterBodiesByCost("carrier", room.energyAvailable);
  if (
    harvester.length &&
    carriers.filter((g) => {
      return carrierBodies.length * CREEP_SPAWN_TIME < (g.ticksToLive || 0);
    }).length < 2
  ) {
    const name = `C_${room.name}_${Game.time}`;

    const spawn = getMainSpawn(room);
    if (spawn && !spawn.spawning && room.energyAvailable > 200) {
      spawn.spawnCreep(carrierBodies, name, {
        memory: {
          mode: "🛒",
          baseRoom: spawn.room.name,
          role: "carrier",
        } as CarrierMemory,
      });
      return OK;
    }
  }

  const { bodies: repairerBodies } = filterBodiesByCost("repairer", Math.max(room.energyAvailable, 300));

  if (
    harvester.length &&
    getRepairTarget(room.name).length > 0 &&
    repairer.filter((g) => {
      return repairerBodies.length * CREEP_SPAWN_TIME < (g.ticksToLive || 0);
    }).length < 1
  ) {
    const name = `R_${room.name}_${Game.time}`;

    const spawn = getMainSpawn(room);
    if (spawn && !spawn.spawning && room.energyAvailable >= 300) {
      spawn.spawnCreep(repairerBodies, name, {
        memory: {
          mode: "🛒",
          baseRoom: spawn.room.name,
          role: "repairer",
        } as RepairerMemory,
      });
      return OK;
    }
  }
}

/** 部屋ごとの色々を建てる */
function creteStructures(room: Room) {
  // 多分最初のspawn
  const spawn = getMainSpawn(room);
  if (!spawn) {
    return;
  }

  const siteInRooms = Object.values(Game.constructionSites)
    .filter((s) => s.room?.name === room.name)
    .reduce(
      (sites, s) => {
        sites.all.push(s);
        (sites[s.structureType] = sites[s.structureType] || []).push(s);
        return sites;
      },
      { all: [] } as Partial<Record<StructureConstant, ConstructionSite[]>> & { all: ConstructionSite[] },
    );

  if (room.controller) {
    if (CONTROLLER_STRUCTURES[STRUCTURE_EXTRACTOR][room.controller.level] && !siteInRooms.extractor && findMyStructures(room).extractor.length === 0) {
      const mineral = _(room.find(FIND_MINERALS)).first();

      if (mineral) {
        mineral.pos.createConstructionSite(STRUCTURE_EXTRACTOR);
      }
      return;
    }

    for (const target of staticStructures) {
      const targets = findMyStructures(room)[target] as _HasRoomPosition[];

      // 対象を扱えて隣にない時
      if (
        CONTROLLER_STRUCTURES[target][room.controller.level] > 0 &&
        spawn.pos.findInRange(targets, 1).length === 0 &&
        (siteInRooms[target]?.length || 0) === 0
      ) {
        for (const [dx, dy] of fourNeighbors) {
          const pos = room.getPositionAt(spawn.pos.x + dx, spawn.pos.y + dy);
          console.log("search replace position", pos);
          if (
            pos
              ?.lookFor(LOOK_STRUCTURES)
              .find((s) => s.structureType === STRUCTURE_EXTENSION)
              ?.destroy() === OK
          ) {
            // extensionが見つかったらとりあえず壊して終わる
            return;
          } else if (pos?.createConstructionSite(target) === OK) {
            // extensionが無ければ立ててみて、成功したら終わる
            return;
          }
        }
      }
    }

    const targets = [STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_SPAWN, STRUCTURE_STORAGE, STRUCTURE_LAB];
    const terrain = room.getTerrain();
    for (const target of targets) {
      const extensions = [...siteInRooms.all, ...room.find(FIND_MY_STRUCTURES)].filter((s) => s.structureType === target);
      if (extensions.length < CONTROLLER_STRUCTURES[target][room.controller.level]) {
        for (const dist of _.range(1, 25)) {
          for (const dy of _.range(-dist, dist + 1)) {
            for (const dx of _.range(-dist, dist + 1)) {
              if (
                Math.abs(dx) + Math.abs(dy) === dist &&
                terrain.get(spawn.pos.x + dx, spawn.pos.y + dy) !== TERRAIN_MASK_WALL &&
                room.createConstructionSite(spawn.pos.x + dx, spawn.pos.y + dy, generateCross(dx, dy) ? target : STRUCTURE_ROAD) === OK
              ) {
                return;
              }
            }
          }
        }
      }
    }
  }
}

/**
 * 十字を作る
 * @returns {boolean} true:建設したいもの false:道
 */
const generateCross = (dx: number, dy: number): boolean => {
  if (dx % 2 === 0) {
    return !((dy + (dx % 4 === 0 ? -2 : 0)) % 4 === 0);
  } else {
    return dy % 2 === 0;
  }
};

// 全てのspawnからsourceまでの道を引く
function roadLayer(room: Room) {
  _(Object.values(Game.spawns).filter((s) => s.room.name === room.name))
    .forEach((spawn) => {
      const findCustomPath = (s: _HasRoomPosition) =>
        spawn.pos.findPathTo(s, {
          ignoreCreeps: true,
          plainCost: 0.5, // 道よりいくらか低い
          swampCost: 0.5, // これから道を引くのでplainと同じ
        });

      return (
        _([
          ...room.find(FIND_SOURCES),
          ...room.find(FIND_MY_STRUCTURES, {
            filter: (s): s is StructureSpawn | StructureExtractor => {
              return s.structureType === STRUCTURE_CONTROLLER || s.structureType === STRUCTURE_EXTRACTOR || s.structureType === STRUCTURE_TOWER;
            },
          }),
        ])
          // 近い順にする
          .sortBy((s) => findCustomPath(s).length)
          .map((s) => {
            return findCustomPath(s).map((path) => {
              if (room.getTerrain().get(path.x, path.y) !== TERRAIN_MASK_WALL) {
                room.createConstructionSite(path.x, path.y, STRUCTURE_ROAD);
              }
            });
          })
          .run()
      );
    })
    .run();
  room.memory.roadLayed = Game.time;
  // メンテコストがかかるので通り抜けられない建物の下にある道を削除する
  [
    ...Object.values(Game.constructionSites).filter((s) => {
      return OBSTACLE_OBJECT_TYPES.some((t) => t === s.structureType);
    }),
    ...room.find(FIND_STRUCTURES, {
      filter: (s) => {
        return OBSTACLE_OBJECT_TYPES.some((t) => t === s.structureType);
      },
    }),
  ].map((s) => {
    room
      .lookForAt(LOOK_STRUCTURES, s.pos)
      .filter((s) => s.structureType === STRUCTURE_ROAD)
      .map((r) => r.destroy());
  });
}

// 上下左右4近傍
const fourNeighbors = [
  [0, -1],
  [-1, 0],
  [1, 0],
  [0, 1],
];

const staticStructures = [STRUCTURE_STORAGE, STRUCTURE_LINK, STRUCTURE_TERMINAL];
