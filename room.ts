import labManager from "./room.labManager";
import { behavior } from "./room.source";
import linkBehavior from "./structure.links";
import { filterBodiesByCost, getCarrierBody, getCreepsInRoom, getMainSpawn } from "./util.creep";
import { findMyStructures, getSitesInRoom } from "./utils";
import { RETURN_CODE_DECODER } from "./util.creep";
import { getSpawnsInRoom } from "./utils";

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
      repairer: 100,
      reserver: 100,
      upgrader: 100,
    };
  }

  const { builder = [], carrier: carriers = [], harvester = [], remoteHarvester = [], reserver = [] } = getCreepsInRoom(room);

  // ロードマップを初期化する
  room.memory.roadMap = room.memory.roadMap || _.range(2500).map(() => Game.time);
  const sources = room.find(FIND_SOURCES);
  sources.forEach((source) => behavior(source));

  const {
    // tower,
    lab,
    link,
  } = findMyStructures(room);

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
    harvester.length &&
    carriers.filter((g) => {
      return carrierBodies.length * CREEP_SPAWN_TIME < (g.ticksToLive || 0);
    }).length < (link.length >= sources.length + 1 ? 1 : 2)
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
  if (
    room.find(FIND_HOSTILE_CREEPS).length > 0 &&
    room.energyAvailable >= room.energyCapacityAvailable * 0.9 &&
    (getCreepsInRoom(room).defender?.length || 0) === 0
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
      return builderBodies.length * CREEP_SPAWN_TIME < (g.ticksToLive || 0);
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
        (c) => c.memory.targetRoomName === targetRoomName && (c.ticksToLive || 0) > bodies.length * CREEP_SPAWN_TIME,
      ).length < 2
    ) {
      const spawn = getSpawnsInRoom(room)?.find((s) => !s.spawning);
      if (spawn) {
        const spawned = spawn.spawnCreep(bodies, `Rh_${room.name}_${targetRoomName}_${Game.time}`, {
          memory: {
            baseRoom: room.name,
            role: "remoteHarvester",
            targetRoomName,
            mode: "🌾",
          } as RemoteHarvesterMemory,
        });
        if (spawned !== OK) {
          console.log("create remotehaervester", RETURN_CODE_DECODER[spawned.toString()]);
        }
      }
    }
  });
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
                generateCross(dx, dy) &&
                room.createConstructionSite(spawn.pos.x + dx, spawn.pos.y + dy, target) === OK
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

// 上下左右4近傍
const fourNeighbors = [
  [0, -1],
  [-1, 0],
  [1, 0],
  [0, 1],
];

const staticStructures = [STRUCTURE_STORAGE, STRUCTURE_LINK, STRUCTURE_TERMINAL];
