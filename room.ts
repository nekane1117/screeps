import labManager from "./room.labManager";
import linkBehavior from "./structure.links";
import { RETURN_CODE_DECODER, filterBodiesByCost, getCarrierBody, getCreepsInRoom, getMainSpawn } from "./util.creep";
import { findMyStructures, getSitesInRoom, getSpawnsInRoom, logUsage } from "./utils";

export function roomBehavior(room: Room) {
  // Roomとしてやっておくこと

  if (room.find(FIND_HOSTILE_CREEPS).length && !room.controller?.safeMode && room.energyAvailable > SAFE_MODE_COST) {
    room.controller?.activateSafeMode();
  }
  logUsage("check carrysize", () => {
    // 初回用初期化処理
    if (!room.memory.carrySize) {
      room.memory.carrySize = {
        builder: 100,
        carrier: 100,
        claimer: 100,
        defender: 100,
        harvester: 100,
        labManager: 100,
        mineralHarvester: 100,
        upgrader: 100,
      };
    }
  });

  const { carrier: carriers = [], harvester = [], gatherer = [] } = logUsage("getCreepsInRoom", () => getCreepsInRoom(room));

  if (room.storage) {
    room.visual.text(room.storage.store.energy.toString(), room.storage.pos.x, room.storage.pos.y, {
      font: 0.25,
    });
  }

  const sources = room.find(FIND_SOURCES);
  // sourceがあるとき
  if (sources.length > 0) {
    if (harvester.filter((h) => (h.ticksToLive || Infinity) > h.body.length * CREEP_SPAWN_TIME).length === 0) {
      const spawn = (() => {
        const spawns = getSpawnsInRoom(room);
        // 部屋にある時は部屋のだけ
        if (spawns.length > 0) {
          return spawns.find((s) => !s.spawning);
        } else {
          return logUsage(
            "find spawn",
            () =>
              _(Object.values(Game.spawns))
                .filter((s) => s.room.energyAvailable === s.room.energyCapacityAvailable)
                .map((spawn) => {
                  return {
                    spawn,
                    cost: PathFinder.search(sources[0].pos, spawn.pos).cost,
                  };
                })
                .min((v) => v.cost).spawn,
          );
        }
      })();

      if (!spawn) {
        console.log(`${room.name} can't find spawn`);
        return ERR_NOT_FOUND;
      }

      if (spawn.room.energyAvailable >= 300) {
        const name = `H_${room.name}_${Game.time}`;
        let total = 0;
        const bodies = (
          sources.length === 1 || spawn.room.energyCapacityAvailable < dynamicMinCost
            ? [WORK, MOVE, CARRY, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE]
            : (_(_.range(50 / 3))
                .map(() => [WORK, MOVE, CARRY])
                .flatten()
                .run() as BodyPartConstant[])
        )
          .slice(0, 50)
          .map((body) => {
            return {
              body,
              total: (total += BODYPART_COST[body]),
            };
          })
          .filter((v) => v.total <= spawn.room.energyAvailable)
          .map((v) => v.body);

        const spawned = spawn.spawnCreep(bodies, name, {
          memory: {
            role: "harvester",
            mode: "H",
            baseRoom: room.name,
          } as HarvesterMemory,
        });
        if (spawned !== OK) {
          console.log(`spawn ${spawn.name}:${RETURN_CODE_DECODER[spawned]}: ${JSON.stringify(bodies)}`);
        }
      }
    }
  }
  //#region updateRoadMap
  logUsage("updateRoadMap", () => updateRoadMap(room));
  //#endregion

  //#region labManager
  logUsage("labManager", () => {
    const { lab } = findMyStructures(room);
    const mineral = _(room.find(FIND_MINERALS)).first();
    if (mineral) {
      labManager(lab, mineral);
    }
  });
  //#endregion

  //#region createStructures
  logUsage("createStructures", () => {
    // 部屋ごとの色々を建てる
    if (room.name === "sim" || Game.time % 100 === 0) {
      createStructures(room);
    }
  });
  //#endregion

  // linkの挙動
  linkBehavior(findMyStructures(room).link);

  //spawn
  const carrierBodies = getCarrierBody(room, "carrier");
  if (harvester.length === 0) {
    return ERR_NOT_FOUND;
  }
  if (
    carriers.filter((g) => {
      return carrierBodies.length * CREEP_SPAWN_TIME < (g.ticksToLive || Infinity);
    }).length < 1
  ) {
    const name = `C_${room.name}_${Game.time}`;

    const spawn = _(getSpawnsInRoom(room))
      .filter((s) => !s.spawning)
      .first();
    if (spawn && !spawn.spawning && room.energyAvailable > 200) {
      spawn.spawnCreep(carrierBodies, name, {
        memory: {
          mode: "G",
          baseRoom: spawn.room.name,
          role: "carrier",
        } as CarrierMemory,
      });
      return OK;
    }
  }

  // defender
  if (
    room.energyAvailable >= room.energyCapacityAvailable * 0.9 &&
    (getCreepsInRoom(room).defender?.length || 0) === 0 &&
    room.find(FIND_HOSTILE_CREEPS).length > 0
  ) {
    const spawn = _(getSpawnsInRoom(room))
      .filter((s) => !s.spawning)
      .first();
    if (spawn) {
      return spawn.spawnCreep(filterBodiesByCost("defender", room.energyAvailable).bodies, `D_${room.name}_${Game.time}`, {
        memory: {
          baseRoom: room.name,
          role: "defender",
        } as DefenderMemory,
      });
    } else {
      console.log("can't find spawn for defender");
    }
  }
  if (checkSpawnBuilder(room)) {
    const spawn = (() => {
      const spawns = getSpawnsInRoom(room);
      if ((room.controller?.level || 0) < 2 && spawns.length > 0) {
        // 自室の時は使えるやつを返す
        return spawns.find((s) => !s.spawning && s.room.energyAvailable === s.room.energyCapacityAvailable);
      } else {
        // 他の部屋も含むときはとにかく一番近いやつを返す
        return _(Object.values(Game.spawns))
          .map((spawn) => {
            return {
              spawn,
              cost: room.controller ? PathFinder.search(room.controller.pos, spawn.pos).cost : Infinity,
            };
          })
          .filter((v) => _.isFinite(v.cost))
          .min((v) => v.cost).spawn;
      }
    })();
    if (spawn && spawn.room.energyAvailable === spawn.room.energyCapacityAvailable) {
      spawn.spawnCreep(filterBodiesByCost("builder", spawn.room.energyCapacityAvailable).bodies, `B_${room.name}_${Game.time}`, {
        memory: {
          mode: "G",
          baseRoom: room.name,
          role: "builder",
        } as BuilderMemory,
      });
    }
  }

  //#region gatherer
  logUsage("gatherer", () => {
    // 容量のある廃墟がある時
    if (
      gatherer.length === 0 &&
      room.storage &&
      room.storage.my &&
      room.energyCapacityAvailable >= 300 &&
      (room.find(FIND_HOSTILE_STRUCTURES, { filter: (s) => !("store" in s) || s.store.getUsedCapacity() === 0 }).length > 0 ||
        room.find(FIND_RUINS, { filter: (r) => r.store.getUsedCapacity() - r.store.energy > 0 }).length > 0 ||
        room.find(FIND_TOMBSTONES, { filter: (r) => r.store.getUsedCapacity() - r.store.energy > 0 }).length > 0)
    ) {
      const spawn = getSpawnsInRoom(room).find((s) => !s.spawning);
      if (spawn) {
        spawn.spawnCreep(filterBodiesByCost("gatherer", room.energyCapacityAvailable).bodies, `G_${room.name}_${Game.time}`, {
          memory: {
            role: "gatherer",
            baseRoom: room.name,
            mode: "G",
          } as GathererMemory,
        });
      }
    }
  });

  //#endregion
}

/** 部屋ごとの色々を建てる */
function createStructures(room: Room) {
  // 多分最初のspawn
  const mainSpawn = getMainSpawn(room);
  if (!mainSpawn) {
    return;
  }

  const { extractor } = findMyStructures(room);
  const { extractor: extractorSite = [] } = _(getSitesInRoom(room))
    .groupBy((s) => s.structureType)
    .value() as Partial<{
    [k in BuildableStructureConstant]: ConstructionSite<k>[];
  }>;

  if (!room.controller) {
    return;
  }
  // extractor扱えるレベルで建設中含め存在しないとき
  if (CONTROLLER_STRUCTURES[STRUCTURE_EXTRACTOR][room.controller.level] && extractorSite.length === 0 && !extractor) {
    const mineral = _(room.find(FIND_MINERALS)).first();

    if (mineral) {
      mineral.pos.createConstructionSite(STRUCTURE_EXTRACTOR);
    }
  }

  const getDiffPosition = (dx: number, dy: number) => {
    return room.getPositionAt(mainSpawn.pos.x + dx, mainSpawn.pos.y + dy);
  };

  // 固定位置オブジェクトたち
  STATIC_STRUCTURES.forEach(({ dx, dy, structureType }) => {
    const pos = getDiffPosition(dx, dy);
    if (pos) {
      const built = pos.lookFor(LOOK_STRUCTURES);

      // 違うものがあるときは壊す
      if (built.filter((s) => s.structureType !== STRUCTURE_ROAD && s.structureType !== structureType).length > 0) {
        built.forEach((b) => b.destroy());
      }

      // 指定のものが無いときは作る
      if (structureType && !built.find((s) => s.structureType === structureType)) {
        pos.createConstructionSite(structureType);
      }
    }
  });

  for (const structureType of [STRUCTURE_OBSERVER, STRUCTURE_EXTENSION, STRUCTURE_TOWER]) {
    const structures = _([findMyStructures(room)[structureType]])
      .flatten()
      .value();
    const sites = getSitesInRoom(room).filter((s) => s.structureType === structureType);
    if (structures.length + sites.length < CONTROLLER_STRUCTURES[structureType][room.controller.level]) {
      // main spawnの位置が奇数か偶数か
      const isOdd = !!((mainSpawn.pos.x + mainSpawn.pos.y) % 2);

      const pos = (room.storage || mainSpawn).pos.findClosestByPath(
        // 全部の場所
        _(2500)
          .range()
          .filter((i) => {
            // 座標取得
            const [x, y] = [i % 50, Math.floor(i / 50)];
            // mainの位置に合わせたやつだけ残す
            return (
              isOdd === !!((x + y) % 2) &&
              !STATIC_STRUCTURES.find(({ dx, dy }) => {
                return x === mainSpawn.pos.x + dx && y === mainSpawn.pos.y + dy;
              })
            );
          })
          .map((i) => {
            // 座標取得
            return room.getPositionAt(i % 50, Math.floor(i / 50));
          })
          .compact()
          .value(),
        {
          filter: (p) => {
            // 建設可能な場所
            return (
              _(p.lookFor(LOOK_TERRAIN)).first() !== "wall" &&
              ![...p.lookFor(LOOK_STRUCTURES), ...p.lookFor(LOOK_CONSTRUCTION_SITES)].find((s) => {
                return s.structureType !== STRUCTURE_ROAD;
              })
            );
          },
          plainCost: 1,
          swampCost: 1,
        },
      );
      pos?.createConstructionSite(structureType);
    }
  }
}

function updateRoadMap(room: Room) {
  const { road: roads, spawn, source } = findMyStructures(room);

  room.memory.roadMap = (room.memory.roadMap || _.range(2500).map(() => 0)).map((usage, i) => {
    const value = Math.min(10, Math.max(-10, usage - 10 / 2000));
    const x = i % 50;
    const y = Math.floor(i / 50);
    if (value > 0) {
      room.visual.text(_.ceil(value, 0).toString(), x, y, {
        opacity: 0.55,
        font: 0.25,
      });
    }

    // 適当な間隔を開ける
    if (Game.time % 600 === 0) {
      const pos = room.getPositionAt(x, y);
      if (pos) {
        const road = _([pos?.lookFor(LOOK_STRUCTURES), pos?.lookFor(LOOK_CONSTRUCTION_SITES)])
          .flatten<Structure | ConstructionSite>()
          .compact()
          .find((s) => s.structureType === STRUCTURE_ROAD);
        if (!road && Math.ceil(value) >= 10 && pos.findInRange([...source, ...roads, ...spawn, ...room.find(FIND_MY_STRUCTURES)], 3).length > 0) {
          // 通るのに道がなくて、道かspawnにつながってるとき
          pos.createConstructionSite(STRUCTURE_ROAD);
        }
      }
    }
    return value;
  });

  // 固定で道を引くところは10固定
  room.memory.staticRoad?.map((s) => {
    room.memory.roadMap[s.y * 50 + s.x] = 10;
  });
}

const STATIC_STRUCTURES = [
  { dy: -2, dx: 2, structureType: undefined },
  { dy: -2, dx: 3, structureType: undefined },
  { dy: -2, dx: 4, structureType: undefined },
  { dy: -1, dx: -1, structureType: STRUCTURE_SPAWN },
  { dy: -1, dx: 1, structureType: undefined },
  { dy: -1, dx: 2, structureType: STRUCTURE_LAB },
  { dy: -1, dx: 3, structureType: STRUCTURE_LAB },
  { dy: -1, dx: 4, structureType: STRUCTURE_LAB },
  { dy: -1, dx: 5, structureType: undefined },
  { dy: 0, dx: -2, structureType: STRUCTURE_SPAWN },
  { dy: 0, dx: 1, structureType: undefined },
  { dy: 0, dx: 2, structureType: STRUCTURE_LAB },
  { dy: 0, dx: 3, structureType: STRUCTURE_LAB },
  { dy: 0, dx: 4, structureType: STRUCTURE_LAB },
  { dy: 0, dx: 5, structureType: undefined },
  { dy: 1, dx: -1, structureType: STRUCTURE_STORAGE },
  { dy: 1, dx: 1, structureType: STRUCTURE_TERMINAL },
  { dy: 1, dx: 3, structureType: STRUCTURE_LAB },
  { dy: 1, dx: 4, structureType: STRUCTURE_LAB },
  { dy: 1, dx: 5, structureType: undefined },
  { dy: 2, dx: -2, structureType: STRUCTURE_POWER_SPAWN },
  { dy: 2, dx: -1, structureType: STRUCTURE_FACTORY },
  { dy: 2, dx: 0, structureType: STRUCTURE_LINK },
  { dy: 2, dx: 2, structureType: undefined },
  { dy: 2, dx: 4, structureType: undefined },
  { dy: 3, dx: 1, structureType: STRUCTURE_NUKER },
];

function checkSpawnBuilder(room: Room) {
  const { builder = [], harvester = [] } = getCreepsInRoom(room);
  // harvesterいないとき or 満タンじゃないときはfalse
  if (harvester.length === 0 || room.energyAvailable < room.energyCapacityAvailable) {
    return false;
  }
  const { bodies: builderBodies } = filterBodiesByCost("builder", room.energyCapacityAvailable);
  /**
   * ビルダーの数が1未満
   */
  return (
    builder.filter((g) => {
      return builderBodies.length * CREEP_SPAWN_TIME < (g.ticksToLive || Infinity);
    }).length < 1
  );
}

const dynamicMinCost = 1000;
