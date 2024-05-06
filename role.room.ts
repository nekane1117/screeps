import { getSpawnNamesInRoom } from "./util.creep";

export function roomBehavior(room: Room) {
  // Roomとしてやっておくこと
  if (room.find(FIND_HOSTILE_CREEPS).length && !room.controller?.safeMode && room.energyAvailable > SAFE_MODE_COST) {
    room.controller?.activateSafeMode();
  }

  if (!room.memory.roadLayed || Math.abs(Game.time - room.memory.roadLayed) > 5000) {
    console.log("roadLayer in " + Game.time);
    roadLayer(room);
  }

  // エクステンション建てる
  creteStructures(room);
}

/** 部屋ごとの色々を建てる */
function creteStructures(room: Room) {
  const spawn = Object.entries(Game.spawns).find(([_, s]) => s.room.name === room.name)?.[1];
  const targets = [STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_SPAWN, STRUCTURE_STORAGE];
  if (room.controller && spawn) {
    const terrain = room.getTerrain();
    for (const target of targets) {
      const extensions = [...room.find(FIND_MY_CONSTRUCTION_SITES), ...room.find(FIND_MY_STRUCTURES)].filter((s) => s.structureType === target);
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
  _(getSpawnNamesInRoom(room))
    .map((name) => Game.spawns[name])
    .compact()
    .forEach((spawn) => {
      const findCustomPath = (s: Source | StructureSpawn) =>
        spawn.pos.findPathTo(s, {
          ignoreCreeps: true,
          plainCost: 1, // 道よりいくらか低い
          swampCost: 1, // これから道を引くのでplainと同じ
          costCallback(roomName, costMatrix) {
            const room = Game.rooms[roomName];
            _.range(50).forEach((x) => {
              _.range(50).forEach((y) => {
                const pos = room.getPositionAt(x, y);
                if (!pos) {
                  return;
                } else if (pos.look().some((s) => "structureType" in s && s.structureType === STRUCTURE_ROAD)) {
                  // 道がある or 道を引く場合道よりほんの少し高くする
                  costMatrix.set(x, y, 1.5);
                }
              });
            });
          },
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
