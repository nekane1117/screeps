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

  const { builder = [], carrier: carriers = [], harvester = [], remoteCarrier = [], remoteHarvester = [], reserver = [] } = getCreepsInRoom(room);

  // ロードマップを更新する
  updateRoadMap(room);

  const {
    // tower,
    lab,
    link,
    source,
  } = findMyStructures(room);
  source.forEach((s) => behavior(s));

  const mineral = _(room.find(FIND_MINERALS)).first();
  if (mineral) {
    labManager(lab, mineral);
  }

  // 部屋ごとの色々を建てる
  if (Game.time % 100 === 0) {
    creteStructures(room);
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
    }).length < (link.length >= source.length + 1 ? 1 : 2)
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
  const { bodies: builderBodies } = filterBodiesByCost("builder", room.energyCapacityAvailable);

  if (
    // ビルダーが居ない
    builder.filter((g) => {
      return builderBodies.length * CREEP_SPAWN_TIME < (g.ticksToLive || Infinity);
    }).length < 1 &&
    // 壊れかけ建物
    (room.find(FIND_STRUCTURES, { filter: (s) => s.hits < s.hitsMax }).length > 0 ||
      // 建設現場
      getSitesInRoom(room).length > 0)
  ) {
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

  room.memory.remote?.forEach((targetRoomName) => {
    // エネルギー満タンの時以外無視する
    if (room.energyAvailable < room.energyCapacityAvailable) {
      return;
    }
    // reserverがいないときは作る
    if (!(reserver as Reserver[]).find((c) => c?.memory?.targetRoomName === targetRoomName)) {
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
    if (
      (remoteHarvester as RemoteHarvester[]).filter(
        (c) => c.memory.targetRoomName === targetRoomName && (c.ticksToLive || Infinity) > bodies.length * CREEP_SPAWN_TIME,
      ).length < 1
    ) {
      const spawn = getSpawnsInRoom(room)?.find((s) => !s.spawning);
      if (spawn) {
        const spawned = spawn.spawnCreep(bodies, `Rh_${room.name}_${targetRoomName}_${Game.time}`, {
          memory: {
            baseRoom: room.name,
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
        if (remoteHarvester.length > 0 && remoteCarrier.length < 1) {
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
}

/** 部屋ごとの色々を建てる */
function creteStructures(room: Room) {
  // 多分最初のspawn
  const mainSpawn = getMainSpawn(room);
  if (!mainSpawn) {
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

    console.log(staticStructures.filter((s) => findMyStructures(room)[s].length === 0));
    for (const target of staticStructures.filter((s) => findMyStructures(room)[s].length === 0)) {
      const targets = findMyStructures(room)[target] as _HasRoomPosition[];

      // 対象を扱えて隣にない時
      if (
        CONTROLLER_STRUCTURES[target][room.controller.level] > 0 &&
        mainSpawn.pos.findInRange(targets, 1).length === 0 &&
        (siteInRooms[target]?.length || 0) === 0
      ) {
        for (const [dx, dy] of fourNeighbors) {
          const pos = room.getPositionAt(mainSpawn.pos.x + dx, mainSpawn.pos.y + dy);
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
              const pos = new RoomPosition(mainSpawn.pos.x + dx, mainSpawn.pos.y + dy, room.name);
              if (
                Math.abs(dx) + Math.abs(dy) === dist &&
                pos &&
                terrain.get(mainSpawn.pos.x + dx, mainSpawn.pos.y + dy) !== TERRAIN_MASK_WALL &&
                generateCross(dx, dy)
              ) {
                // 建設予定地にすでに何か建ててるときはキャンセルする
                pos.lookFor(LOOK_CONSTRUCTION_SITES).forEach((s) => s.remove());
                if (room.createConstructionSite(mainSpawn.pos.x + dx, mainSpawn.pos.y + dy, target) === OK) {
                  return;
                }
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

// 上下左右4近傍
const fourNeighbors = [
  [0, -1],
  [-1, 0],
  [1, 0],
  [0, 1],
];

const staticStructures = [STRUCTURE_STORAGE, STRUCTURE_LINK, STRUCTURE_TERMINAL];

function updateRoadMap(room: Room) {
  const { road: roads, spawn } = findMyStructures(room);

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
        } else if (!road && Math.ceil(value) >= 10 && pos.findInRange([...roads, ...spawn, ...room.find(FIND_MY_STRUCTURES)], 3).length > 0) {
          // 通るのに道がなくて、道かspawnにつながってるとき
          pos.createConstructionSite(STRUCTURE_ROAD);
        }
      }
    }
    return value;
  });
}
