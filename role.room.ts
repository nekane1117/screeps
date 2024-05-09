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
  const { visual } = room;
  // 多分最初のspawn
  const spawn = Object.values(Game.spawns).find((s) => s.room.name === room.name);
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
    // linkを扱えてspawnの横にlinkが無いとき
    if (
      CONTROLLER_STRUCTURES[STRUCTURE_LINK][room.controller.level] > 0 &&
      spawn.pos.findInRange(FIND_STRUCTURES, 1, { filter: (s) => s.structureType === STRUCTURE_LINK }).length === 0 &&
      (siteInRooms.link?.length || 0) === 0
    ) {
      for (const [dx, dy] of fourNeighbors) {
        const pos = room.getPositionAt(spawn.pos.x + dx, spawn.pos.y + dy);
        // 壁とかなら無視
        if (!pos) {
          break;
        }

        // そこにあるものは壊す
        pos.lookFor(LOOK_STRUCTURES).map((s) => s.destroy());

        return pos.createConstructionSite(STRUCTURE_LINK);
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
  room.memory.energySummary = (room.memory.energySummary || [])
    .concat(
      room.getEventLog().reduce(
        (summary, event) => {
          switch (event.event) {
            case EVENT_HARVEST:
              summary.production += event.data.amount;
              break;
            case EVENT_BUILD:
            case EVENT_REPAIR:
            case EVENT_UPGRADE_CONTROLLER:
              summary.consumes += event.data.energySpent;
              break;
            default:
              break;
          }
          return summary;
        },
        {
          production: 0,
          consumes: 0,
        },
      ),
    )
    .slice(-CREEP_LIFE_TIME);

  const total = room.memory.energySummary.reduce(
    (sum, current) => {
      sum.consumes += current.consumes || 0;
      sum.production += current.production || 0;
      return sum;
    },
    {
      production: 0,
      consumes: 0,
    },
  );

  visual.text(`生産量：${_.floor(total.production / room.memory.energySummary.length, 2)}`, 0, 1, {
    align: "left",
  });
  visual.text(`消費量：${_.floor(total.consumes / room.memory.energySummary.length, 2)}`, 0, 2, {
    align: "left",
  });
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
                  costMatrix.set(x, y, 2);
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

// 上下左右4近傍
const fourNeighbors = [
  [0, -1],
  [-1, 0],
  [1, 0],
  [0, 1],
];
