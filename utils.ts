import { ROAD_DECAY_AMOUNT_SWAMP, ROAD_DECAY_AMOUNT_WALL } from "./constants";

export function getCapacityRate(s: AnyCreep | Structure, type: ResourceConstant = RESOURCE_ENERGY) {
  if ("store" in s) {
    return s.store.getUsedCapacity(type) / s.store.getCapacity(type);
  } else {
    return Infinity;
  }
}

export const findMyStructures = (room: Room) => {
  // 無ければ初期化
  if (!room.memory.find) {
    room.memory.find = {};
  }

  // 同じ時間のキャッシュならそのまま返す
  if (room.memory.find?.[FIND_STRUCTURES]?.time === Game.time) {
    return room.memory.find[FIND_STRUCTURES].data;
  } else {
    return (room.memory.find[FIND_STRUCTURES] = {
      time: Game.time,
      data: room.find(FIND_STRUCTURES).reduce(
        (structures, s) => {
          structures.all.push(s);
          (structures[s.structureType] as AnyStructure[]).push(s);
          return structures;
        },
        {
          all: [],
          constructedWall: [],
          container: [],
          controller: [],
          extension: [],
          extractor: [],
          factory: [],
          invaderCore: [],
          keeperLair: [],
          lab: [],
          link: [],
          nuker: [],
          observer: [],
          portal: [],
          powerBank: [],
          powerSpawn: [],
          rampart: [],
          road: [],
          spawn: [],
          storage: [],
          terminal: [],
          tower: [],
          source: room.find(FIND_SOURCES),
        } as MyStructureCache,
      ),
    }).data;
  }
};

export function getSpawnsInRoom(r: Room | string) {
  const room = _.isString(r) ? Game.rooms[r] : r;

  if (!room) {
    return [];
  }

  return Object.values(Game.spawns).filter((s) => s.pos.roomName === room.name);
}

export function getSitesInRoom(r: Room | string) {
  const room = _.isString(r) ? Game.rooms[r] : r;

  if (!room) {
    return [];
  }

  return Object.values(Game.constructionSites).filter((s) => s.pos.roomName === room.name);
}

export function getSpawnsOrderdByRange(src: RoomPosition | _HasRoomPosition, maxRooms?: number) {
  const pos = "pos" in src ? src.pos : src;

  return _(Object.values(Game.spawns))
    .map((spawn) => {
      return {
        spawn,
        distance: Game.map.getRoomLinearDistance(pos.roomName, spawn.room.name),
      };
    })
    .filter((s) => s.spawn.room.name === "sim" || s.distance <= (maxRooms || Infinity))
    .sort(({ spawn: s1, distance: d1 }, { spawn: s2, distance: d2 }) => {
      const df = d1 - d2;
      // 部屋が違うときは部屋ごとの距離
      if (df !== 0) {
        return df;
      }
      // 同じ部屋にいるときは対象からの距離
      return pos.getRangeTo(s1) - pos.getRangeTo(s2);
    })
    .map((p) => p.spawn);
}

export function getSpawnsWithDistance(src: RoomPosition | _HasRoomPosition) {
  const pos = "pos" in src ? src.pos : src;

  return _(Object.values(Game.spawns)).map((spawn) => {
    return {
      spawn,
      distance: Game.map.getRoomLinearDistance(pos.roomName, spawn.room.name),
    };
  });
}

export function isCompound(resource: ResourceConstant) {
  // 2文字以上で大文字で始まるやつ
  return !!(resource.length >= 2 && /^[A-Z]/.exec(resource));
}

export function getLabs(room: Room) {
  const lab = findMyStructures(room).lab;
  // 自分の周囲にあるラボの数が少ない順
  return _(lab).map((lab) => {
    return Object.assign(lab, {
      memory: room.memory.labs[lab.id],
    }) as StructureLab & { memory: LabMemory };
  });
}

export function getTerminals() {
  return _(Object.values(Game.rooms))
    .map((r) => r.terminal)
    .compact()
    .run();
}

let indent = -1;
export function logUsage<T = unknown>(title: string, func: () => T, threthold = 0) {
  if (indent > 10) {
    indent = -1;
  }
  indent++;
  const start = Game.cpu.getUsed();
  const value = func();

  const used = _.floor(Game.cpu.getUsed() - start, 2);
  used >= threthold && console.log(`${" ".repeat(indent * 2)}${used} ${title}`);
  indent = Math.max(indent - 1, 0);
  return value;
}

export function isHighway(room: Room) {
  const parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(room.name);
  return parsed && (Number(parsed[1]) % 10 === 0 || Number(parsed[2]) % 10 === 0);
}

/**
 * 今のエネルギー保有量で輸送可能な最大量
 */
export function calcMaxTransferAmount(order: Order, terminal: StructureTerminal) {
  // 部屋名がないのはよくわからないので無視する
  if (!order.roomName) {
    return 0;
  }
  return Math.floor(terminal.store.energy / (1 - Math.exp(-Game.map.getRoomLinearDistance(terminal.room.name, order.roomName) / 30)));
}

/** ただのアノテーション */
export function readonly<T>(a: T) {
  return a as Readonly<T>;
}

export function getDecayAmount(s: Structure) {
  switch (s.structureType) {
    case STRUCTURE_RAMPART:
      return RAMPART_DECAY_AMOUNT;
    case STRUCTURE_CONTAINER:
      return CONTAINER_DECAY;
    case STRUCTURE_ROAD:
      switch (s.room.getTerrain().get(s.pos.x, s.pos.y)) {
        case TERRAIN_MASK_SWAMP:
          return ROAD_DECAY_AMOUNT_SWAMP;
        case TERRAIN_MASK_WALL:
          return ROAD_DECAY_AMOUNT_WALL;
        default:
          return ROAD_DECAY_AMOUNT;
      }
    default:
      return 0;
  }
}

export function getOrderRemainingTotal(terminal: StructureTerminal, resourceType: ResourceConstant) {
  return _(Object.values(Game.market.orders))
    .filter((o) => o.type === ORDER_SELL && o.resourceType === resourceType && o.roomName === terminal.room.name)
    .sum((o) => o.remainingAmount);
}

export function getAvailableAmount(terminal: StructureTerminal, resourceType: ResourceConstant) {
  // 実際持ってる量に売り注文の合計を引いたものを返す
  return terminal.store[resourceType] - getOrderRemainingTotal(terminal, resourceType);
}
