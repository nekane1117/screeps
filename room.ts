import labManager from "./room.labManager";
import { behavior } from "./room.source";
import linkBehavior from "./structure.links";
import { RETURN_CODE_DECODER, filterBodiesByCost, getCarrierBody, getCreepsInRoom, getMainSpawn } from "./util.creep";
import { findMyStructures, getSitesInRoom, getSpawnsInRoom } from "./utils";

export function roomBehavior(room: Room) {
  // Roomとしてやっておくこと

  if (room.find(FIND_HOSTILE_CREEPS).length && !room.controller?.safeMode && room.energyAvailable > SAFE_MODE_COST) {
    room.controller?.activateSafeMode();
  }

  // 初回用初期化処理
  if (!room.memory.carrySize) {
    room.memory.carrySize = {
      builder: 100,
      carrier: 100,
      claimer: 100,
      defender: 100,
      harvester: 100,
      labManager: 100,
      mineralCarrier: 100,
      mineralHarvester: 100,
      remoteHarvester: 100,
      reserver: 100,
      upgrader: 100,
    };
  }

  const { carrier: carriers = [], harvester = [], remoteCarrier = [], remoteHarvester = [], reserver = [] } = getCreepsInRoom(room);

  if (room.storage) {
    room.visual.text(room.storage.store.energy.toString(), room.storage.pos.x, room.storage.pos.y, {
      font: 0.25,
    });
  }

  //#region remote #########################################################################
  room.memory.remote?.forEach((targetRoomName) => {
    // エネルギー満タンの時以外無視する
    if (room.energyAvailable < Math.max(600, room.energyCapacityAvailable)) {
      return;
    }
    const filterThisRemote = (c: RemoteCarrier | RemoteHarvester | Reserver) => c?.memory?.targetRoomName === targetRoomName;

    const { roomRemoteCarrier, roomRemoteHarvester, roomReserver } = {
      roomReserver: reserver.filter(filterThisRemote),
      roomRemoteCarrier: remoteCarrier.filter(filterThisRemote),
      roomRemoteHarvester: remoteHarvester.filter(filterThisRemote),
    };

    // reserverがいないときは作る
    if (roomReserver.length === 0) {
      const spawn = getSpawnsInRoom(room)?.find((s) => !s.spawning);
      if (spawn) {
        const spawned = spawn.spawnCreep(filterBodiesByCost("reserver", room.energyAvailable).bodies, `V_${room.name}_${targetRoomName}_${Game.time}`, {
          memory: {
            baseRoom: room.name,
            role: "reserver",
            targetRoomName,
          } as ReserverMemory,
        });
        if (spawned !== OK) {
          console.log("crete reserver", RETURN_CODE_DECODER[spawned.toString()]);
        }
      }
    }
    // harvesterがいないときは作る
    const { bodies } = filterBodiesByCost("remoteHarvester", room.energyAvailable);
    if (roomRemoteHarvester.length < 1) {
      const spawn = getSpawnsInRoom(room)?.find((s) => !s.spawning);
      if (spawn) {
        const spawned = spawn.spawnCreep(bodies, `Rh_${room.name}_${targetRoomName}_${Game.time}`, {
          memory: {
            baseRoom: room.name,
            mode: "🌾",
            role: "remoteHarvester",
            targetRoomName,
          } as RemoteHarvesterMemory,
        });
        if (spawned !== OK) {
          console.log("create remotehaervester", RETURN_CODE_DECODER[spawned.toString()]);
        }
      }
    }

    _(getCarrierBody(room, "remoteCarrier"))
      .tap((body) => {
        //harvesterが居るのにcarrierが居ないとき
        if (roomRemoteHarvester.length > 0 && roomRemoteCarrier.length < 1) {
          const spawn = getSpawnsInRoom(room)?.find((s) => !s.spawning);
          if (spawn) {
            const spawned = spawn.spawnCreep(body, `Rc_${room.name}_${targetRoomName}_${Game.time}`, {
              memory: {
                baseRoom: room.name,
                role: "remoteCarrier",
                targetRoomName,
                mode: "🛒",
              } as RemoteCarrierMemory,
            });
            if (spawned !== OK) {
              console.log("create remotehaervester", RETURN_CODE_DECODER[spawned.toString()]);
            }
          }
        }
      })
      .run();
  });
  //#endregion remote ######################################################################

  // ロードマップを更新する
  updateRoadMap(room);

  const { lab, source } = findMyStructures(room);
  source.forEach((s) => behavior(s));

  const mineral = _(room.find(FIND_MINERALS)).first();
  if (mineral) {
    labManager(lab, mineral);
  }

  // 部屋ごとの色々を建てる
  if (room.name === "sim" || Game.time % 100 === 0) {
    createStructures(room);
  }

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
          mode: "🛒",
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
      if (spawns.length > 0) {
        // 自室の時は使えるやつを返す
        return spawns.find((s) => !s.spawning && s.room.energyAvailable === s.room.energyCapacityAvailable);
      } else {
        // 他の部屋も含むときはとにかく一番近いやつを返す
        return room.controller?.pos.findClosestByPath(Object.values(Game.spawns));
      }
    })();
    if (spawn && spawn.room.energyAvailable === spawn.room.energyCapacityAvailable) {
      spawn.spawnCreep(filterBodiesByCost("builder", spawn.room.energyCapacityAvailable).bodies, `B_${room.name}_${Game.time}`, {
        memory: {
          mode: "🛒",
          baseRoom: spawn.room.name,
          role: "builder",
        } as BuilderMemory,
      });
    }
  }
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

  for (const structureType of [STRUCTURE_OBSERVER, STRUCTURE_TOWER, STRUCTURE_EXTENSION]) {
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
        if (road && value < 0) {
          // 道が使われてないとき
          "remove" in road ? road.remove() : road.destroy();
        } else if (!road && Math.ceil(value) >= 10 && pos.findInRange([...source, ...roads, ...spawn, ...room.find(FIND_MY_STRUCTURES)], 3).length > 0) {
          // 通るのに道がなくて、道かspawnにつながってるとき
          pos.createConstructionSite(STRUCTURE_ROAD);
        }
      }
    }
    return value;
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
  { dy: 2, dx: 0, structureType: STRUCTURE_LINK },
  { dy: 2, dx: 2, structureType: undefined },
  { dy: 2, dx: 4, structureType: undefined },
  { dy: 3, dx: -1, structureType: STRUCTURE_FACTORY },
  { dy: 3, dx: 1, structureType: STRUCTURE_NUKER },
];

function checkSpawnBuilder(room: Room) {
  const { builder = [] } = getCreepsInRoom(room);
  // 満タンじゃないときはfalse
  if (room.energyAvailable < room.energyCapacityAvailable) {
    return false;
  }
  const { bodies: builderBodies } = filterBodiesByCost("builder", room.energyCapacityAvailable);
  return (
    builder.filter((g) => {
      return builderBodies.length * CREEP_SPAWN_TIME < (g.ticksToLive || Infinity);
    }).length < 1
  );
}
