import { behavior } from "./room.source";
import linkBehavior from "./structure.links";
import { filterBodiesByCost, getCreepsInRoom, getMainSpawn } from "./util.creep";
import { findMyStructures, logUsage } from "./utils";

export function roomBehavior(room: Room) {
  // Roomとしてやっておくこと

  if (room.find(FIND_HOSTILE_CREEPS).length && !room.controller?.safeMode && room.energyAvailable > SAFE_MODE_COST) {
    room.controller?.activateSafeMode();
  }

  if (Game.time % 2) {
    logUsage("source:" + room.name, () => {
      room.find(FIND_SOURCES).forEach((source) => behavior(source));
    });
  }

  // 道を敷く
  if (!room.memory.roadLayed || Math.abs(Game.time - room.memory.roadLayed) > 5000) {
    console.log("roadLayer in " + Game.time);
    roadLayer(room);
  }

  // エクステンション建てる
  if (Game.time % 100 === 0) {
    creteStructures(room);
  }

  linkBehavior(findMyStructures(room).link);
  const { carrier: carriers, harvester } = getCreepsInRoom(room).reduce(
    (creeps, c) => {
      creeps[c.memory.role] = (creeps?.[c.memory.role] || []).concat(c);
      return creeps;
    },
    { builder: [], claimer: [], carrier: [], harvester: [], upgrader: [] } as Record<ROLES, Creep[]>,
  );

  const { bodies, cost } = filterBodiesByCost("carrier", room.energyAvailable);
  if (
    harvester.length &&
    carriers.filter((g) => {
      return bodies.length * CREEP_SPAWN_TIME < (g.ticksToLive || 0);
    }).length < room.find(FIND_SOURCES).length
  ) {
    const name = `C_${room.name}_${Game.time}`;

    const spawn = getMainSpawn(room);
    if (spawn && !spawn.spawning && room.energyAvailable > 200) {
      if (
        spawn.spawnCreep(bodies, name, {
          memory: {
            mode: "🛒",
            baseRoom: spawn.room.name,
            role: "carrier",
          } as CarrierMemory,
        }) === OK
      ) {
        room.memory.energySummary?.push({
          time: new Date().valueOf(),
          consumes: cost,
          production: 0,
        });
      }
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

    const targets = [STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_SPAWN, STRUCTURE_STORAGE];
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
      const findCustomPath = (s: Source | StructureSpawn) =>
        spawn.pos.findPathTo(s, {
          ignoreCreeps: true,
          plainCost: 0.5, // 道よりいくらか低い
          swampCost: 0.5, // これから道を引くのでplainと同じ
        });

      return (
        _([
          ...room.find(FIND_SOURCES),
          ...room.find(FIND_MY_STRUCTURES, {
            filter: (s): s is StructureSpawn => s.structureType === STRUCTURE_CONTROLLER,
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

const staticStructures = [STRUCTURE_STORAGE, STRUCTURE_LINK];
