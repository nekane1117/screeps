"use strict";

// util.array.ts
function complexOrder(arr, evaluation) {
  return _(
    [...arr].sort((e1, e2) => {
      for (const func of evaluation) {
        const result = func(e1) - func(e2);
        if (result !== 0 /* KEEP */) {
          return result;
        }
      }
      return 0 /* KEEP */;
    })
  );
}

// utils.common.ts
function ObjectKeys(o) {
  return Object.keys(o);
}
function ObjectEntries(o) {
  return Object.entries(o);
}
var allResouces = {};
function getRoomResouces(room) {
  var _a;
  allResouces = allResouces || {};
  let roomResouces = allResouces[room.name];
  if (roomResouces && roomResouces.timestamp === Game.time) {
    return roomResouces;
  }
  roomResouces = allResouces[room.name] = {
    timestamp: Game.time
  };
  const { factory } = findMyStructures(room);
  for (const storage of _.compact([room.storage, room.terminal, factory, ...getLabs(room).run(), ...getCreepsInRoom(room).labManager || []])) {
    for (const resource of RESOURCES_ALL) {
      roomResouces[resource] = (roomResouces[resource] || 0) + ((_a = storage.store.getUsedCapacity(resource)) != null ? _a : 0);
    }
  }
  return roomResouces;
}

// constants.ts
var COMMODITY_INGREDIENTS = _(ObjectEntries(COMMODITIES)).map(([key, value]) => {
  return [key, ...ObjectKeys(value.components)];
}).flatten().uniq();
var TRANSFER_THRESHOLD = 1e3;
var LAB_STRATEGY = {
  builder: RESOURCE_CATALYZED_LEMERGIUM_ACID,
  mineralHarvester: RESOURCE_CATALYZED_UTRIUM_ALKALIDE,
  upgrader: RESOURCE_CATALYZED_GHODIUM_ACID
};
var REVERSE_REACTIONS = {
  GH: ["G", "H"],
  GO: ["G", "O"],
  GH2O: ["GH", "OH"],
  XGH2O: ["GH2O", "X"],
  XGHO2: ["GHO2", "X"],
  GHO2: ["GO", "OH"],
  KH: ["H", "K"],
  LH: ["H", "L"],
  OH: ["H", "O"],
  UH: ["H", "U"],
  ZH: ["H", "Z"],
  KO: ["K", "O"],
  ZK: ["K", "Z"],
  KH2O: ["KH", "OH"],
  XKH2O: ["KH2O", "X"],
  XKHO2: ["KHO2", "X"],
  KHO2: ["KO", "OH"],
  LO: ["L", "O"],
  UL: ["L", "U"],
  LH2O: ["LH", "OH"],
  XLH2O: ["LH2O", "X"],
  XLHO2: ["LHO2", "X"],
  LHO2: ["LO", "OH"],
  UO: ["O", "U"],
  ZO: ["O", "Z"],
  UH2O: ["UH", "OH"],
  UHO2: ["UO", "OH"],
  ZH2O: ["ZH", "OH"],
  ZHO2: ["ZO", "OH"],
  XUH2O: ["UH2O", "X"],
  XUHO2: ["UHO2", "X"],
  G: ["UL", "ZK"],
  XZH2O: ["X", "ZH2O"],
  XZHO2: ["X", "ZHO2"],
  H: void 0,
  K: void 0,
  L: void 0,
  O: void 0,
  U: void 0,
  X: void 0,
  Z: void 0
};
var ALL_REACTIONS = _(ObjectKeys(REVERSE_REACTIONS)).sortBy((r) => r === "G" ? 0 : r.length);
var ROAD_DECAY_AMOUNT_SWAMP = 500;
var ROAD_DECAY_AMOUNT_WALL = 15e3;

// utils.ts
function getCapacityRate(s, type = RESOURCE_ENERGY) {
  if ("store" in s) {
    return s.store.getUsedCapacity(type) / s.store.getCapacity(type);
  } else {
    return Infinity;
  }
}
var findMyStructures = (room) => {
  var _a, _b;
  if (!room.memory.find) {
    room.memory.find = {};
  }
  if (((_b = (_a = room.memory.find) == null ? void 0 : _a[FIND_STRUCTURES]) == null ? void 0 : _b.time) === Game.time) {
    return room.memory.find[FIND_STRUCTURES].data;
  } else {
    return (room.memory.find[FIND_STRUCTURES] = {
      time: Game.time,
      data: room.find(FIND_STRUCTURES).reduce(
        (structures2, s) => {
          structures2.all.push(s);
          switch (s.structureType) {
            case STRUCTURE_CONTROLLER:
              structures2.controller = s;
              break;
            case STRUCTURE_POWER_SPAWN:
              structures2.powerSpawn = s;
              break;
            case STRUCTURE_STORAGE:
              structures2.storage = s;
              break;
            case STRUCTURE_OBSERVER:
              structures2.observer = s;
              break;
            case STRUCTURE_EXTRACTOR:
              structures2.extractor = s;
              break;
            case STRUCTURE_TERMINAL:
              structures2.terminal = s;
              break;
            case STRUCTURE_NUKER:
              structures2.nuker = s;
              break;
            case STRUCTURE_FACTORY:
              structures2.factory = s;
              break;
            default:
              structures2[s.structureType].push(s);
              break;
          }
          return structures2;
        },
        {
          all: [],
          constructedWall: [],
          container: [],
          controller: room.controller,
          extension: [],
          extractor: void 0,
          factory: void 0,
          invaderCore: [],
          keeperLair: [],
          lab: [],
          link: [],
          nuker: void 0,
          observer: void 0,
          portal: [],
          powerBank: [],
          powerSpawn: void 0,
          rampart: [],
          road: [],
          spawn: [],
          storage: room.storage,
          terminal: room.terminal,
          tower: [],
          source: room.find(FIND_SOURCES)
        }
      )
    }).data;
  }
};
function getSpawnsInRoom(r) {
  const room = _.isString(r) ? Game.rooms[r] : r;
  if (!room) {
    return [];
  }
  return Object.values(Game.spawns).filter((s) => s.pos.roomName === room.name);
}
function getSitesInRoom(r) {
  const room = _.isString(r) ? Game.rooms[r] : r;
  if (!room) {
    return [];
  }
  return Object.values(Game.constructionSites).filter((s) => s.pos.roomName === room.name);
}
function getSpawnsOrderdByRange(src, maxRooms) {
  const pos = "pos" in src ? src.pos : src;
  return _(Object.values(Game.spawns)).map((spawn) => {
    return {
      spawn,
      distance: Game.map.getRoomLinearDistance(pos.roomName, spawn.room.name)
    };
  }).filter((s) => s.spawn.room.name === "sim" || s.distance <= (maxRooms || Infinity)).sort(({ spawn: s1, distance: d1 }, { spawn: s2, distance: d2 }) => {
    const df = d1 - d2;
    if (df !== 0) {
      return df;
    }
    return pos.getRangeTo(s1) - pos.getRangeTo(s2);
  }).map((p) => p.spawn);
}
function isCompound(resource) {
  return !!(resource === RESOURCE_GHODIUM || resource.length >= 2 && /^[A-Z]/.exec(resource));
}
function getLabs(room) {
  const lab = findMyStructures(room).lab;
  return _(lab).map((lab2) => {
    return Object.assign(lab2, {
      memory: room.memory.labs[lab2.id]
    });
  });
}
function getTerminals() {
  return _(Object.values(Game.rooms)).map(({ terminal }) => {
    if (terminal) {
      return Object.assign(terminal, {
        memory: (Memory.terminals = Memory.terminals || {})[terminal.id] = Memory.terminals[terminal.id] || {}
      });
    } else {
      return void 0;
    }
  }).compact().run();
}
var indent = -1;
function logUsage(title, func, threthold = 0) {
  if (indent > 10) {
    indent = -1;
  }
  indent++;
  const start = Game.cpu.getUsed();
  const value = func();
  const used = _.floor(Game.cpu.getUsed() - start, 2);
  if (used >= threthold) {
    console.log(`${" ".repeat(indent * 2)}${used} ${title}`);
  }
  indent = Math.max(indent - 1, 0);
  return value;
}
function isHighway(room) {
  const parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(room.name);
  return parsed && (Number(parsed[1]) % 10 === 0 || Number(parsed[2]) % 10 === 0);
}
function readonly(a) {
  return a;
}
function getDecayAmount(s) {
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

// util.creep.ts
var squareDiff = Object.freeze([
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1]
]);
function filterBodiesByCost(role, cost, opts) {
  var _a;
  const { acrossRoom = false } = opts || {};
  const idealBody = IDEAL_BODY[role];
  if (acrossRoom) {
    const move = idealBody.filter((b) => b === MOVE);
    const notMove = idealBody.filter((b) => b !== MOVE);
    idealBody.push(..._.range(notMove.length - move.length).map(() => MOVE));
  }
  const bodies = idealBody.reduce(
    (bodies2, parts) => {
      var _a2;
      const total = ((_a2 = _.last(bodies2)) == null ? void 0 : _a2.total) || 0;
      return bodies2.concat({
        parts,
        total: total + BODYPART_COST[parts]
      });
    },
    []
  ).filter(({ total }) => {
    return total <= cost;
  });
  return {
    bodies: complexOrder(
      bodies.map((c) => c.parts),
      [
        (p) => {
          return [TOUGH, MOVE, CARRY, WORK, CLAIM, ATTACK, RANGED_ATTACK, HEAL].indexOf(p);
        }
      ]
    ).run(),
    cost: ((_a = _.last(bodies)) == null ? void 0 : _a.total) || 0
  };
}
var DIRECTIONS = {
  [TOP_LEFT]: "TOP_LEFT",
  [TOP]: "TOP",
  [TOP_RIGHT]: "TOP_RIGHT",
  [LEFT]: "LEFT",
  [RIGHT]: "RIGHT",
  [BOTTOM_LEFT]: "BOTTOM_LEFT",
  [BOTTOM]: "BOTTOM",
  [BOTTOM_RIGHT]: "BOTTOM_RIGHT"
};
var IDEAL_BODY = Object.freeze({
  builder: _.range(50).map((i) => {
    const b = [WORK, MOVE, CARRY, MOVE];
    return b[i % b.length];
  }),
  claimer: [CLAIM, MOVE],
  carrier: [],
  labManager: [MOVE, CARRY, CARRY],
  defender: _.range(50).map((i) => {
    const b = [MOVE, RANGED_ATTACK, RANGED_ATTACK, MOVE, HEAL, HEAL, MOVE, TOUGH, ATTACK];
    return b[i % b.length];
  }),
  gatherer: [
    MOVE,
    WORK,
    MOVE,
    CARRY,
    MOVE,
    CARRY,
    MOVE,
    CARRY,
    MOVE,
    CARRY,
    MOVE,
    CARRY,
    MOVE,
    CARRY,
    MOVE,
    CARRY,
    MOVE,
    CARRY,
    MOVE,
    CARRY,
    MOVE,
    CARRY,
    MOVE,
    CARRY,
    MOVE,
    CARRY,
    MOVE,
    CARRY,
    MOVE,
    CARRY,
    MOVE,
    CARRY,
    MOVE,
    CARRY,
    MOVE,
    CARRY,
    MOVE,
    CARRY,
    MOVE,
    CARRY,
    MOVE,
    CARRY,
    MOVE,
    CARRY,
    MOVE,
    CARRY,
    MOVE,
    CARRY,
    MOVE,
    CARRY
  ],
  harvester: [
    // 最小構成
    WORK,
    MOVE,
    CARRY,
    // 作業効率
    WORK,
    WORK,
    WORK,
    WORK,
    MOVE,
    MOVE
  ],
  mineralHarvester: [
    ..._(
      _.range(50 / 4).map(() => {
        return [WORK, MOVE, CARRY, MOVE];
      })
    ).flatten().slice(0, 50).run()
  ],
  upgrader: [WORK, MOVE, CARRY, WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, WORK, MOVE]
});
var RETURN_CODE_DECODER = Object.freeze({
  [OK.toString()]: "OK",
  [ERR_NOT_OWNER.toString()]: "ERR_NOT_OWNER",
  [ERR_NO_PATH.toString()]: "ERR_NO_PATH",
  [ERR_NAME_EXISTS.toString()]: "ERR_NAME_EXISTS",
  [ERR_BUSY.toString()]: "ERR_BUSY",
  [ERR_NOT_FOUND.toString()]: "ERR_NOT_FOUND",
  [ERR_NOT_ENOUGH_RESOURCES.toString()]: "ERR_NOT_ENOUGH",
  [ERR_INVALID_TARGET.toString()]: "ERR_INVALID_TARGET",
  [ERR_FULL.toString()]: "ERR_FULL",
  [ERR_NOT_IN_RANGE.toString()]: "ERR_NOT_IN_RANGE",
  [ERR_INVALID_ARGS.toString()]: "ERR_INVALID_ARGS",
  [ERR_TIRED.toString()]: "ERR_TIRED",
  [ERR_NO_BODYPART.toString()]: "ERR_NO_BODYPART",
  [ERR_RCL_NOT_ENOUGH.toString()]: "ERR_RCL_NOT_ENOUGH",
  [ERR_GCL_NOT_ENOUGH.toString()]: "ERR_GCL_NOT_ENOUGH"
});
var customMove = (creep, target, opt) => {
  var _a, _b, _c;
  if (creep.fatigue) {
    return OK;
  }
  creep.memory.moved = creep.moveTo(target, {
    plainCost: 2,
    swampCost: 10,
    serializeMemory: false,
    ignoreCreeps: !(creep.memory.__avoidCreep || creep.pos.inRangeTo(target, DEFAULT_CREEP_RANGE[creep.memory.role] + 2)),
    ...opt,
    visualizePathStyle: {
      opacity: 0.55,
      stroke: toColor(creep),
      ...opt == null ? void 0 : opt.visualizePathStyle
    }
  });
  if (creep.memory.moved === OK && Game.time % 3) {
    const { dy, dx } = ((_b = (_a = creep.memory._move) == null ? void 0 : _a.path) == null ? void 0 : _b[0]) || {};
    const isInRange = (n) => {
      return 0 < n && n < 49;
    };
    if (dx !== void 0 && dy !== void 0 && isInRange(creep.pos.x + dx) && isInRange(creep.pos.y + dy)) {
      const blocker = _.first(creep.room.lookForAt(LOOK_CREEPS, creep.pos.x + dx, creep.pos.y + dy));
      if (blocker && ((_c = blocker == null ? void 0 : blocker.memory) == null ? void 0 : _c.moved) !== OK) {
        const pull = creep.pull(blocker);
        const move = blocker.move(creep);
        creep.memory._move = void 0;
        blocker.memory._move = void 0;
        blocker.memory.__avoidCreep = true;
        if (pull || move) {
          console.log(JSON.stringify({ name: creep.name, pull: RETURN_CODE_DECODER[pull.toString()], move: RETURN_CODE_DECODER[move.toString()] }));
        }
      }
    }
  }
  return creep.memory.moved;
};
function getCreepsInRoom(room) {
  var _a;
  if (!room) {
    return { timestamp: Game.time };
  }
  if (((_a = room.memory.creeps) == null ? void 0 : _a.timestamp) === Game.time) {
    return room.memory.creeps;
  } else {
    return room.memory.creeps = Object.values(Game.creeps).filter((c) => c.memory.baseRoom === room.name).reduce(
      (creeps, c) => {
        if (!creeps[c.memory.role]) {
          creeps[c.memory.role] = [];
        }
        creeps[c.memory.role].push(c);
        return creeps;
      },
      {
        timestamp: Game.time
      }
    );
  }
}
function getMainSpawn(room) {
  const spawn = room.memory.mainSpawn && Game.getObjectById(room.memory.mainSpawn);
  if (spawn) {
    return spawn;
  } else {
    const spawn2 = _(Object.values(Game.spawns).filter((s) => s.room.name === room.name)).first();
    room.memory.mainSpawn = spawn2 == null ? void 0 : spawn2.id;
    return spawn2;
  }
}
function pickUpAll(creep, resourceType = RESOURCE_ENERGY) {
  let result = void 0;
  creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1, {
    filter: (s) => s.resourceType === resourceType
  }).forEach((resource) => {
    if (creep.pickup(resource) === OK) {
      result = OK;
    }
  });
  [
    ...creep.pos.findInRange(FIND_TOMBSTONES, 1, {
      filter(s) {
        return s.store.getUsedCapacity() > 0;
      }
    }),
    ...creep.pos.findInRange(FIND_RUINS, 1, {
      filter(s) {
        return s.store.getUsedCapacity() > 0;
      }
    })
  ].forEach((tombstone) => {
    if (creep.withdraw(tombstone, resourceType)) {
      result = OK;
    }
  });
  return result;
}
function withdrawBy(creep, roles, type = RESOURCE_ENERGY) {
  return creep.pos.findInRange(FIND_MY_CREEPS, 1, {
    filter: (c) => roles.includes(c.memory.role)
  }).map((t) => t.transfer(creep, type));
}
function toColor({ id }) {
  return `#${id.slice(-6)}`;
}
function moveRoom(creep, fromRoom, toRoom) {
  var _a, _b, _c, _d;
  const memory = readonly(creep.memory);
  creep.memory.__moveRoom = memory.__moveRoom || {};
  const route = ((_a = memory.__moveRoom) == null ? void 0 : _a.route) || (creep.memory.__moveRoom.route = Game.map.findRoute(fromRoom, toRoom, {
    routeCallback(roomName) {
      var _a2, _b2;
      const parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
      const isHighway2 = parsed && (Number(parsed[1]) % 10 === 0 || Number(parsed[2]) % 10 === 0);
      if (isHighway2 || ((_b2 = (_a2 = Game.rooms[roomName]) == null ? void 0 : _a2.controller) == null ? void 0 : _b2.my)) {
        return 1;
      } else {
        return 2.5;
      }
    }
  }));
  if (!Array.isArray(route)) {
    creep.memory.__moveRoom.route = void 0;
    return route;
  }
  const current = route[route.findIndex((r) => r.room === creep.pos.roomName) + 1];
  if (!current) {
    creep.memory.__moveRoom.route = void 0;
    return;
  }
  if (((_c = (_b = memory.__moveRoom) == null ? void 0 : _b.exit) == null ? void 0 : _c.roomName) !== creep.pos.roomName) {
    creep.memory.__moveRoom.exit = creep.pos.findClosestByPath(current.exit);
  }
  const moved = ((_d = memory.__moveRoom) == null ? void 0 : _d.exit) && customMove(creep, new RoomPosition(memory.__moveRoom.exit.x, memory.__moveRoom.exit.y, memory.__moveRoom.exit.roomName));
  if (moved !== OK) {
    const code = moved ? RETURN_CODE_DECODER[moved.toString()] : "no exit";
    console.log(`${creep.name}:${code}`);
    creep.say(code.replace("ERR_", ""));
    creep.memory.__moveRoom.route = void 0;
    creep.memory.__moveRoom.exit = void 0;
  }
  return moved;
}
function getCarrierBody(room, role) {
  var _a;
  const safetyFactor = 2;
  const bodyCycle = [MOVE, CARRY, CARRY];
  let costTotal = 0;
  const avgSize = ((_a = room.memory.carrySize) == null ? void 0 : _a[role]) || 100;
  return _.range(Math.ceil(avgSize / 50) * safetyFactor * 3).slice(0, 50).map((i) => {
    const parts = i === 1 ? WORK : bodyCycle[i % bodyCycle.length];
    costTotal += BODYPART_COST[parts];
    return { parts, costTotal };
  }).filter((p) => p.costTotal <= room.energyAvailable).map((p) => p.parts);
}
var DEFAULT_CREEP_RANGE = {
  builder: 3,
  carrier: 1,
  claimer: 1,
  defender: 3,
  gatherer: 1,
  harvester: 1,
  labManager: 1,
  mineralHarvester: 1,
  upgrader: 1
};
function getRepairPower(creep) {
  return _(creep.body).filter((b) => b.type === WORK).map((b) => {
    return REPAIR_POWER * (b.boost && REVERSE_BOOSTS.repair[b.boost] || 1);
  }).sum();
}
var REVERSE_BOOSTS = {
  harvest: {
    [RESOURCE_UTRIUM_OXIDE]: BOOSTS.work[RESOURCE_UTRIUM_OXIDE].harvest,
    [RESOURCE_UTRIUM_ALKALIDE]: BOOSTS.work[RESOURCE_UTRIUM_ALKALIDE].harvest,
    [RESOURCE_CATALYZED_UTRIUM_ALKALIDE]: BOOSTS.work[RESOURCE_CATALYZED_UTRIUM_ALKALIDE].harvest
  },
  repair: {
    [RESOURCE_LEMERGIUM_ACID]: BOOSTS.work[RESOURCE_LEMERGIUM_ACID].repair,
    [RESOURCE_LEMERGIUM_HYDRIDE]: BOOSTS.work[RESOURCE_LEMERGIUM_HYDRIDE].repair,
    [RESOURCE_CATALYZED_LEMERGIUM_ACID]: BOOSTS.work[RESOURCE_CATALYZED_LEMERGIUM_ACID].repair
  },
  build: {
    [RESOURCE_LEMERGIUM_ACID]: BOOSTS.work[RESOURCE_LEMERGIUM_ACID].repair,
    [RESOURCE_LEMERGIUM_HYDRIDE]: BOOSTS.work[RESOURCE_LEMERGIUM_HYDRIDE].repair,
    [RESOURCE_CATALYZED_LEMERGIUM_ACID]: BOOSTS.work[RESOURCE_CATALYZED_LEMERGIUM_ACID].repair
  }
};

// flag.red.ts
function behavior(flag) {
  var _a, _b;
  if (flag.color !== COLOR_RED) {
    console.log(`${flag.name} is not red`);
    return ERR_INVALID_ARGS;
  }
  if (!Object.values(Game.creeps).find((c) => {
    const isC2 = (c2) => {
      return c2.memory.role === "claimer";
    };
    return isC2(c) && c.memory.flagName === flag.name;
  })) {
    const spawn = getSpawnsOrderdByRange(flag).find((s) => {
      var _a2, _b2;
      return (_b2 = (_a2 = Game.rooms[s.room.name]) == null ? void 0 : _a2.controller) == null ? void 0 : _b2.level;
    });
    if (spawn) {
      if (spawn.spawning) {
        console.log("closest spawn spawning");
      } else {
        if (spawn.room.energyAvailable > 650) {
          spawn.spawnCreep(filterBodiesByCost("claimer", spawn.room.energyAvailable).bodies, `C_${flag.pos.roomName}_${flag.name}`, {
            memory: {
              role: "claimer",
              baseRoom: (flag.room || spawn.room).name,
              flagName: flag.name
            }
          });
        } else {
          console.log(spawn.name, "spawn energy is shorage");
        }
      }
    } else {
      console.log("spawn not found");
    }
  }
  if (((_b = (_a = flag.room) == null ? void 0 : _a.controller) == null ? void 0 : _b.my) && flag.pos.createConstructionSite(STRUCTURE_SPAWN) === OK) {
    flag.remove();
  }
}

// flag.white.ts
function behavior2(flag) {
  flag.pos.lookFor(LOOK_STRUCTURES).forEach((s) => s.destroy());
  flag.remove();
}

// flag.purple.ts
function behavior3(flag) {
  var _a;
  if (flag.color !== COLOR_PURPLE) {
    console.log(`${flag.name} is not purple`);
    return ERR_INVALID_ARGS;
  }
  const room = Game.rooms[flag.pos.roomName];
  if ((_a = room.controller) == null ? void 0 : _a.my) {
    room.find(FIND_STRUCTURES).forEach((s) => s.destroy());
    Object.values(Game.creeps).filter((c) => c.pos.roomName === flag.pos.roomName || c.memory.baseRoom === flag.pos.roomName).forEach((c) => c.suicide());
    Object.values(Game.constructionSites).filter((c) => c.pos.roomName === flag.pos.roomName).forEach((c) => c.remove());
    room.controller.unclaim();
  }
  flag.remove();
}

// flags.ts
var flags_default = {
  [COLOR_RED]: behavior,
  [COLOR_WHITE]: behavior2,
  [COLOR_PURPLE]: behavior3
};

// role.carrier.ts
var behavior4 = (creep) => {
  var _a, _b, _c, _d, _e, _f, _g;
  const { room } = creep;
  const moveMeTo = (target, opt) => {
    customMove(creep, target, {
      plainCost: 2,
      swampCost: 2,
      ignoreCreeps: true,
      ...opt
    });
  };
  if (!isCarrier(creep)) {
    return console.log(`${creep.name} is not Carrier`);
  }
  function checkMode2() {
    var _a2;
    if (!isCarrier(creep)) {
      return console.log(`${creep.name} is not Carrier`);
    }
    const newMode = ((c) => {
      var _a3;
      if (c.memory.mode === "D" && creep.store.energy === 0) {
        return "G";
      }
      if (c.memory.mode === "G" && creep.store.energy >= Math.max(creep.store.getCapacity(RESOURCE_ENERGY) / 2, EXTENSION_ENERGY_CAPACITY[((_a3 = creep.room.controller) == null ? void 0 : _a3.level) || 0])) {
        return "D";
      }
      return c.memory.mode;
    })(creep);
    if (creep.memory.mode !== newMode) {
      creep.say(newMode);
      creep.memory.mode = newMode;
      if (newMode === "G") {
        creep.memory.storeId = void 0;
      }
      creep.memory.transferId = void 0;
      if (newMode === "D") {
        const alpha = 0.01;
        (creep.room.memory.carrySize = creep.room.memory.carrySize || {}).carrier = (((_a2 = creep.room.memory.carrySize) == null ? void 0 : _a2.carrier) || 100) * (1 - alpha) + creep.store.energy * alpha;
      }
    }
  }
  checkMode2();
  const center = room.storage || getMainSpawn(room);
  if (!center) {
    return creep.say("center not found");
  }
  if (creep.memory.storeId) {
    const store = Game.getObjectById(creep.memory.storeId);
    if (!store || "store" in store && store.store.energy < CARRY_CAPACITY) {
      creep.memory.storeId = void 0;
    }
  }
  if (!creep.memory.storeId) {
    creep.memory.storeId = (_a = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
      filter: (d) => d.resourceType === RESOURCE_ENERGY && d.amount > 0
    })) == null ? void 0 : _a.id;
  }
  if (!creep.memory.storeId) {
    creep.memory.storeId = (_b = creep.pos.findClosestByPath(FIND_TOMBSTONES, {
      filter: (d) => d.store.energy > 0
    })) == null ? void 0 : _b.id;
  }
  if (!creep.memory.storeId) {
    creep.memory.storeId = (_c = creep.pos.findClosestByPath(FIND_RUINS, {
      filter: (d) => d.store.energy > 0
    })) == null ? void 0 : _c.id;
  }
  const { link, container, storage, terminal, factory } = findMyStructures(room);
  if (!creep.memory.storeId) {
    creep.memory.storeId = (_d = link.find((l) => getCapacityRate(l) > 0.5 && center.pos.inRangeTo(l, 3))) == null ? void 0 : _d.id;
  }
  const controllerContaeiner = (_e = creep.room.controller) == null ? void 0 : _e.pos.findClosestByRange(container, {
    filter: (c) => creep.room.controller && c.pos.inRangeTo(creep.room.controller, 3)
  });
  if (!creep.memory.storeId) {
    const allTargets = _([...container.filter((c) => c.id !== (controllerContaeiner == null ? void 0 : controllerContaeiner.id)), storage, factory, terminal]).compact();
    creep.memory.storeId = (_f = allTargets.filter((s) => s.store.energy > 0).sortBy((s) => {
      if (s.structureType === STRUCTURE_STORAGE || s.structureType === STRUCTURE_FACTORY || s.structureType === STRUCTURE_TERMINAL) {
        return s.store.energy - s.room.energyAvailable;
      } else {
        return s.store.energy;
      }
    }).last()) == null ? void 0 : _f.id;
  }
  if (!creep.memory.storeId) {
    creep.memory.storeId = controllerContaeiner == null ? void 0 : controllerContaeiner.id;
  }
  if (creep.memory.storeId && creep.memory.mode === "G") {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store) {
      if (!creep.pos.isNearTo(store)) {
        moveMeTo(store, { range: 1 });
      }
      if (creep.pos.isNearTo(store)) {
        creep.memory.worked = "resourceType" in store ? creep.pickup(store) : creep.withdraw(store, RESOURCE_ENERGY);
        switch (creep.memory.worked) {
          // 空の時
          case ERR_NOT_ENOUGH_RESOURCES:
            creep.memory.storeId = void 0;
            checkMode2();
            break;
          // お腹いっぱい
          case ERR_FULL:
            checkMode2();
            break;
          // 有りえない系
          case ERR_NOT_IN_RANGE:
          //先に判定してるのでないはず
          case ERR_NOT_OWNER:
          case ERR_INVALID_TARGET:
          case ERR_INVALID_ARGS:
            console.log(`${creep.name} transfer returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
            creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
            break;
          // 問題ない系
          case OK:
          case ERR_BUSY:
          default:
            creep.memory.storeId = void 0;
            checkMode2();
            break;
        }
      }
    }
  }
  if (creep.memory.transferId) {
    const store = Game.getObjectById(creep.memory.transferId);
    if (store && "store" in store && store.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      creep.memory.transferId = void 0;
    }
  }
  creep.memory.transferId = creep.memory.transferId || ((_g = findTransferTarget(creep.room)) == null ? void 0 : _g.id);
  if (!creep.memory.transferId) {
    return ERR_NOT_FOUND;
  }
  if (creep.memory.transferId && creep.memory.mode === "D") {
    const transferTarget = Game.getObjectById(creep.memory.transferId);
    if (transferTarget) {
      if (!creep.pos.isNearTo(transferTarget)) {
        moveMeTo(transferTarget, { range: 1 });
      }
      if (creep.pos.isNearTo(transferTarget)) {
        const returnVal = creep.transfer(transferTarget, RESOURCE_ENERGY);
        switch (returnVal) {
          // 手持ちがない
          case ERR_NOT_ENOUGH_RESOURCES:
            checkMode2();
            break;
          // 対象が変
          case ERR_INVALID_TARGET:
          // 対象が変
          case ERR_FULL:
            creep.memory.transferId = void 0;
            break;
          // 有りえない系
          case ERR_NOT_IN_RANGE:
          //先に判定してるのでないはず
          case ERR_NOT_OWNER:
          // 自creepじゃない
          case ERR_INVALID_ARGS:
            console.log(`${creep.name} transfer returns ${RETURN_CODE_DECODER[returnVal.toString()]}`);
            creep.say(RETURN_CODE_DECODER[returnVal.toString()]);
            break;
          // 問題ない系
          case OK:
          case ERR_BUSY:
          // spawining
          default:
            if (getCapacityRate(transferTarget) > 0.9) {
              creep.memory.transferId = void 0;
            }
            break;
        }
      } else {
        const { extension, spawn } = findMyStructures(room);
        _([...extension, ...spawn].filter((e) => creep.pos.isNearTo(e) && e.store.getFreeCapacity(RESOURCE_ENERGY))).tap(([head]) => {
          if (head) {
            creep.transfer(head, RESOURCE_ENERGY);
          }
        }).run();
      }
    } else {
      creep.memory.transferId = void 0;
    }
  }
  withdrawBy(creep, ["harvester"]);
  pickUpAll(creep);
};
var role_carrier_default = behavior4;
function isCarrier(creep) {
  return creep.memory.role === "carrier";
}
function findTransferTarget(room) {
  var _a, _b, _c, _d;
  const canter = room.storage || getMainSpawn(room);
  if (!canter) {
    console.log(room.name, "center not found");
    return null;
  }
  const { extension, spawn, tower, container, factory } = findMyStructures(room);
  const controllerContaeiner = room.controller && _(room.controller.pos.findInRange(container, 3)).first();
  return _([
    //spawnかextension
    ..._([...extension, ...spawn]).filter((s) => s.store.getFreeCapacity(RESOURCE_ENERGY)).sortBy((e) => {
      return Math.atan2(e.pos.y - canter.pos.y, canter.pos.x - e.pos.x) + (_(Object.values(getCreepsInRoom(room)) || []).flatten().find((c) => c.memory && "transferId" in c.memory && c.memory.transferId === e.id) ? Math.PI * 2 : 0);
    }).run(),
    // タワーに入れて防衛
    ...tower.filter((t) => t.store.getFreeCapacity(RESOURCE_ENERGY) > 0),
    ((_a = room.terminal) == null ? void 0 : _a.my) && (((_b = room.terminal) == null ? void 0 : _b.store.energy) || 0) <= _.floor(TRANSFER_THRESHOLD * 2, -2) ? room.terminal : null,
    ...getLabs(room).filter((l) => l.store.getFreeCapacity(RESOURCE_ENERGY) > 0).run(),
    // storageにキャッシュ
    (((_c = room.storage) == null ? void 0 : _c.store.energy) || 0) < room.energyCapacityAvailable && ((_d = room.storage) == null ? void 0 : _d.my) ? room.storage : null,
    // コントローラー強化
    controllerContaeiner && getCapacityRate(controllerContaeiner) < 0.9 ? controllerContaeiner : null,
    //貯蓄順
    ((factory == null ? void 0 : factory.store.energy) || 0) <= _.floor(TRANSFER_THRESHOLD, -2) ? factory : null,
    room.storage
  ]).compact().filter((s) => !("my" in s) || s.my).first();
}

// role.builder.ts
var behavior5 = (creep) => {
  var _a, _b, _c, _d;
  if (!isBuilder(creep)) {
    return console.log(`${creep.name} is not Builder`);
  }
  const mySite = _(Game.constructionSites).values().filter((c) => {
    var _a2;
    return ((_a2 = c.room) == null ? void 0 : _a2.name) === creep.memory.baseRoom;
  }).run();
  if (creep.pos.roomName !== creep.memory.baseRoom && mySite.length > 0) {
    return moveRoom(creep, creep.pos.roomName, creep.memory.baseRoom);
  }
  const moveMeTo = (target, opt) => {
    var _a2;
    const pos = "pos" in target ? target.pos : target;
    (_a2 = Game.rooms[pos.roomName]) == null ? void 0 : _a2.visual.text("x", pos, {
      color: toColor(creep)
    });
    return customMove(creep, target, {
      maxRooms: 0,
      swampCost: 2,
      plainCost: 2,
      ...opt
    });
  };
  const checkMode2 = () => {
    const newMode = ((c) => {
      if (c.memory.mode === "W" && c.store.energy === 0) {
        return "G";
      }
      if (c.memory.mode === "G" && creep.store.energy >= CARRY_CAPACITY) {
        return "W";
      }
      return c.memory.mode;
    })(creep);
    if (newMode !== creep.memory.mode) {
      creep.memory.mode = newMode;
      creep.memory.firstAidId = void 0;
      creep.memory.buildingId = void 0;
      creep.memory.storeId = void 0;
      creep.memory.transferId = void 0;
      creep.say(creep.memory.mode);
    }
  };
  checkMode2();
  const { road, rampart, container, link } = findMyStructures(creep.room);
  if (creep.memory.mode === "W") {
    if (creep.memory.firstAidId) {
      const target = Game.getObjectById(creep.memory.firstAidId);
      if (!target || target.hits > getDecayAmount(target) * 10) {
        creep.memory.firstAidId = void 0;
      }
    }
    if (!creep.memory.firstAidId) {
      creep.memory.firstAidId = (_a = _([...road, ...rampart, ...container]).filter((s) => {
        if (s.structureType === STRUCTURE_ROAD && s.room.memory.roadMap[s.pos.y * 50 + s.pos.x] < 0) {
          return false;
        }
        return s.hits <= getDecayAmount(s) * 10;
      }).sortBy((s) => s.hits / (getDecayAmount(s) * 10)).first()) == null ? void 0 : _a.id;
    }
    if (creep.memory.firstAidId) {
      const target = Game.getObjectById(creep.memory.firstAidId);
      if (target) {
        return _(creep.repair(target)).tap((code) => {
          if (code === ERR_NOT_IN_RANGE) {
            if (creep.memory.mode === "W") {
              moveMeTo(target);
            }
          }
        }).run();
      }
    }
    if (!isBoosted(creep) && boost(creep) !== null) {
      return;
    }
    if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0 || (creep.room.storage ? _([creep.room.storage.store.energy, ...(getCreepsInRoom(creep.room).carrier || []).map((c) => c.store.energy)]).compact().sum() : creep.room.energyAvailable) >= creep.room.energyCapacityAvailable) {
      if (creep.memory.buildingId) {
        const target = Game.getObjectById(creep.memory.buildingId);
        if (!target) {
          creep.memory.buildingId = void 0;
        }
      }
      if (creep.memory.buildingId || // 可読性悪いので条件は関数化
      (creep.memory.buildingId = findBuildTarget(creep))) {
        const site = Game.getObjectById(creep.memory.buildingId);
        if (site) {
          return _(creep.memory.built = creep.build(site)).tap((built) => {
            switch (built) {
              // 対象が変な時はクリアする
              case ERR_INVALID_TARGET:
                creep.memory.buildingId = void 0;
                break;
              // 建築モードで離れてるときは近寄る
              case ERR_NOT_IN_RANGE:
                moveMeTo(site, { range: 3 });
                break;
              // 有りえない系
              case ERR_NOT_OWNER:
              // 自creepじゃない
              case ERR_NO_BODYPART:
                console.log(`${creep.name} build returns ${RETURN_CODE_DECODER[built == null ? void 0 : built.toString()]}`);
                creep.say(RETURN_CODE_DECODER[built == null ? void 0 : built.toString()]);
                break;
              // 問題ない系
              case OK:
              case ERR_BUSY:
              case ERR_NOT_ENOUGH_RESOURCES:
              default:
                break;
            }
          }).run();
        }
      }
      if (creep.memory.repairId) {
        const target = creep.memory.repairId && Game.getObjectById(creep.memory.repairId);
        if (!target || target.hits === target.hitsMax) {
          creep.memory.repairId = void 0;
        }
      }
      if (creep.memory.repairId || (creep.memory.repairId = findRepairTarget(creep))) {
        const target = creep.memory.repairId && Game.getObjectById(creep.memory.repairId);
        if (target) {
          if (!isBoosted(creep) && boost(creep) !== null) {
            return;
          }
          target.room.visual.text("x", target.pos, {
            opacity: 1 - _.ceil(target.hits / target.hitsMax, 1)
          });
          return _(creep.repair(target)).tap((repaired) => {
            var _a2;
            switch (repaired) {
              case ERR_NOT_IN_RANGE:
                return moveMeTo(target, { range: 3 });
              case OK:
                creep.memory.repairId = (_a2 = _(
                  creep.pos.findInRange(FIND_STRUCTURES, 4, { filter: (s) => s.structureType === target.structureType && s.hits < s.hitsMax })
                ).min((s) => s.hits)) == null ? void 0 : _a2.id;
                return moveMeTo(target, { range: 3 });
              default:
                return;
            }
          }).run();
        }
      }
    } else {
      const preTarget = creep.memory.transferId && Game.getObjectById(creep.memory.transferId);
      if (!preTarget || preTarget.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        creep.memory.transferId = void 0;
      }
      const transferTarget = creep.memory.transferId ? Game.getObjectById(creep.memory.transferId) : findTransferTarget(creep.room);
      if (transferTarget) {
        if (!creep.pos.isNearTo(transferTarget)) {
          moveMeTo(transferTarget, {
            ignoreCreeps: !creep.pos.inRangeTo(transferTarget, 2)
          });
        }
        if (transferTarget.structureType !== STRUCTURE_STORAGE) {
          creep.memory.transferId = transferTarget.id;
          creep.transfer(transferTarget, RESOURCE_ENERGY);
        }
      }
    }
  } else {
    const capacityThreshold = creep.room.controller ? EXTENSION_ENERGY_CAPACITY[creep.room.controller.level] : CARRY_CAPACITY;
    if (creep.memory.storeId && (((_b = Game.getObjectById(creep.memory.storeId)) == null ? void 0 : _b.store.energy) || 0) < capacityThreshold) {
      creep.memory.storeId = void 0;
    }
    if (!creep.memory.storeId) {
      creep.memory.storeId = (_c = creep.pos.findClosestByRange(
        _.compact([
          ...container,
          ...link.filter((l) => {
            const main = getMainSpawn(l.room);
            return main && l.pos.inRangeTo(main, 3);
          }),
          ...[creep.room.terminal, creep.room.storage].filter(
            (t) => t && t.store.energy > t.room.energyCapacityAvailable + creep.store.getCapacity(RESOURCE_ENERGY)
          )
        ]),
        {
          filter: (s) => {
            return s.store.energy >= capacityThreshold;
          }
        }
      )) == null ? void 0 : _c.id;
    }
    creep.memory.storeId = creep.memory.storeId || ((_d = creep.room.storage) == null ? void 0 : _d.id);
    if (!creep.memory.storeId && container.filter((c) => c.store.energy > 0).length === 0) {
      const source = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE, {
        filter: (s) => s.room.name === creep.memory.baseRoom
      });
      if (source) {
        if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
          moveMeTo(source);
        }
        return;
      }
    }
    const store = creep.memory.storeId && Game.getObjectById(creep.memory.storeId);
    if (store && "store" in store) {
      creep.memory.worked = creep.withdraw(store, RESOURCE_ENERGY);
      switch (creep.memory.worked) {
        case ERR_NOT_ENOUGH_RESOURCES:
        // 空っぽ
        case ERR_INVALID_TARGET:
          creep.memory.storeId = void 0;
          break;
        case ERR_NOT_IN_RANGE:
          _(moveMeTo(store)).tap((moved) => {
            if (moved !== OK) {
              console.log(`${creep.name} ${RETURN_CODE_DECODER[moved.toString()]}`);
              creep.say(RETURN_CODE_DECODER[moved.toString()]);
            }
          }).run();
          break;
        // 有りえない系
        case ERR_NOT_OWNER:
        case ERR_INVALID_ARGS:
          console.log(`${creep.name} build returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
          creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
          break;
        // 問題ない系
        case OK:
        case ERR_FULL:
        case ERR_BUSY:
        default:
          if (store.store.getUsedCapacity(RESOURCE_ENERGY) < creep.getActiveBodyparts(CARRY) * CARRY_CAPACITY) {
            creep.memory.storeId = void 0;
          }
          break;
      }
    }
  }
  withdrawBy(creep, ["harvester", "upgrader"]);
  pickUpAll(creep);
};
var role_builder_default = behavior5;
function isBuilder(creep) {
  return creep.memory.role === "builder";
}
var boosts = [RESOURCE_CATALYZED_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_HYDRIDE];
function isBoosted(creep) {
  return creep.body.filter((b) => b.type === WORK).every((b) => b.boost !== void 0);
}
function boost(creep) {
  var _a;
  const moveMeTo = (target, opt) => customMove(creep, target, {
    ...opt
  });
  const labs = getLabs(creep.room);
  const unBoostedBodies = creep.body.filter((b) => b.type === WORK && !b.boost);
  const lab = (_a = boosts.map((mineralType) => {
    return {
      lab: labs.find(
        (l) => l.mineralType === mineralType && l.store[l.mineralType] >= LAB_BOOST_MINERAL * unBoostedBodies.length && l.store.energy >= LAB_BOOST_ENERGY * unBoostedBodies.length
      ),
      mineralType
    };
  }).find((l) => l.lab)) == null ? void 0 : _a.lab;
  if (lab) {
    if (creep.pos.isNearTo(lab)) {
      return lab.boostCreep(creep);
    } else {
      return moveMeTo(lab);
    }
  } else {
    return null;
  }
}
function findBuildTarget(creep) {
  var _a;
  return (_a = _(getSitesInRoom(Game.rooms[creep.memory.baseRoom])).sortBy((s) => {
    const getPriority = () => {
      if (creep.room.energyCapacityAvailable > 600) {
        const priority = [
          // 壁は急ぐ
          STRUCTURE_RAMPART,
          STRUCTURE_WALL,
          // とりあえず輸送
          STRUCTURE_ROAD,
          // 仮倉庫
          STRUCTURE_CONTAINER,
          // 仮倉庫
          STRUCTURE_SPAWN,
          // 輸送
          STRUCTURE_LINK,
          // extension
          STRUCTURE_EXTENSION,
          // 防衛
          STRUCTURE_TOWER,
          // 貯蔵
          STRUCTURE_STORAGE,
          // LAB
          STRUCTURE_TERMINAL,
          STRUCTURE_LAB
        ];
        const idx = priority.findIndex((c) => c === s.structureType);
        if (idx >= 0) {
          return idx;
        } else {
          return priority.length;
        }
      } else {
        return 0;
      }
    };
    return getPriority() * 1e6 + (s.progressTotal - s.progress) * (s.pos.getRangeTo(creep) + 1);
  }).first()) == null ? void 0 : _a.id;
}
function findRepairTarget(creep) {
  var _a;
  return (_a = _(
    findMyStructures(creep.room).all.filter((s) => {
      if (s.structureType === STRUCTURE_ROAD && s.room.memory.roadMap[s.pos.y * 50 + s.pos.x] < 0) {
        return false;
      }
      return s.hits < Math.min(s.hitsMax, 3e6) - getRepairPower(creep);
    })
  ).sortBy((s) => s.hits * ROAD_DECAY_TIME + ("ticksToDecay" in s ? s.ticksToDecay || 0 : ROAD_DECAY_TIME)).first()) == null ? void 0 : _a.id;
}

// role.claimer.ts
var behavior6 = (claimer) => {
  var _a, _b, _c, _d;
  if (!isClaimer(claimer)) {
    return console.log(`${claimer.name} is not Builder`);
  }
  const moveMeTo = (target2) => customMove(claimer, target2, {});
  const flag = Game.flags[claimer.memory.flagName];
  if (!flag) {
    claimer.suicide();
  }
  if ((((_b = (_a = flag.room) == null ? void 0 : _a.controller) == null ? void 0 : _b.level) || 0) > 0) {
    const spawn = getSpawnsOrderdByRange(flag).first();
    if (spawn) {
      const recycle = spawn.recycleCreep(claimer);
      if (recycle === OK) {
        return recycle;
      } else if (recycle === ERR_NOT_IN_RANGE) {
        return moveMeTo(spawn);
      }
    } else {
      return ERR_NOT_FOUND;
    }
  }
  const target = ((_c = flag.room) == null ? void 0 : _c.controller) || flag;
  if (((_d = target.room) == null ? void 0 : _d.name) === claimer.room.name && "structureType" in target) {
    const claimed = claimer.claimController(target);
    switch (claimed) {
      case ERR_NOT_IN_RANGE:
        moveMeTo(target);
        break;
      case OK:
        break;
      default:
        console.log("claimer", RETURN_CODE_DECODER[claimed.toString()]);
        break;
    }
  } else {
    moveMeTo(target);
  }
};
var role_claimer_default = behavior6;
function isClaimer(creep) {
  return creep.memory.role === "claimer";
}

// role.defender.ts
var behavior7 = (creep) => {
  var _a, _b, _c;
  const moveMeTo = (target, opt) => customMove(creep, target, {
    ...opt
  });
  if (!isD(creep)) {
    return console.log(`${creep.name} is not Defender`);
  }
  if (creep.room.name !== creep.memory.baseRoom) {
    const controller = (_a = Game.rooms[creep.memory.baseRoom]) == null ? void 0 : _a.controller;
    return controller && moveMeTo(controller);
  }
  if (creep.memory.targetId || (creep.memory.targetId = (_b = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS)) == null ? void 0 : _b.id) || (creep.memory.targetId = (_c = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES)) == null ? void 0 : _c.id)) {
    const target = Game.getObjectById(creep.memory.targetId);
    if (target) {
      if ("structureType" in target || "body" in target && target.body.filter((b) => b.type === ATTACK).length === 0) {
        moveMeTo(target);
      } else {
        const rampartInRange = target.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: (s) => s.structureType === STRUCTURE_RAMPART && s.my && target.pos.inRangeTo(s, 3)
        });
        if (rampartInRange) {
          moveMeTo(rampartInRange);
        } else if (creep.pos.isNearTo(target)) {
          const start = creep.pos.getDirectionTo(target) + 3;
          creep.move(
            _.range(start, start + 3).map((dir) => {
              if (dir > 8) {
                dir = dir - 8;
              }
              return dir;
            })[_.random(2)]
          );
        } else {
          moveMeTo(target, { range: 3 });
        }
      }
      if (target) {
        creep.rangedAttack(target);
        if (creep.pos.isNearTo(target)) {
          if ("structureType" in target) {
            creep.dismantle(target);
          }
          creep.attack(target);
        }
      }
    } else {
      creep.memory.targetId = void 0;
      return ERR_NOT_FOUND;
    }
  }
  const heald = _(creep.pos.findInRange(FIND_MY_CREEPS, 3, { filter: (s) => s.hits < s.hitsMax - creep.getActiveBodyparts(HEAL) * HEAL_POWER })).tap((creeps) => {
    const target = _(creeps).min((c) => c.hits);
    if (target) {
      if (creep.pos.isNearTo(target)) {
        creep.heal(target);
      } else {
        creep.rangedHeal(target);
      }
    }
  }).run().length;
  if (!creep.memory.targetId && heald === 0) {
    const spawn = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, { filter: (s) => s.my && s.structureType === STRUCTURE_SPAWN });
    if (spawn && spawn.recycleCreep(creep) === ERR_NOT_IN_RANGE) {
      moveMeTo(spawn);
    }
  }
};
var role_defender_default = behavior7;
function isD(creep) {
  return creep.memory.role === "defender";
}

// role.gatherer.ts
var behavior8 = (creep) => {
  var _a, _b, _c, _d;
  const { room } = creep;
  const moveMeTo = (target, opt) => {
    customMove(creep, target, {
      plainCost: 2,
      swampCost: 5,
      ...opt
    });
  };
  if (!isGatherer(creep)) {
    return console.log(`${creep.name} is not Gatherer`);
  }
  if (!creep.room.storage) {
    return creep.suicide();
  }
  function checkMode2() {
    var _a2;
    if (!isGatherer(creep)) {
      return console.log(`${creep.name} is not Gatherer`);
    }
    const newMode = ((c) => {
      if (c.memory.mode === "D" && creep.store.getUsedCapacity() === 0) {
        return "G";
      }
      if (c.memory.mode === "G" && creep.store.getUsedCapacity() >= Math.min(creep.store.getCapacity(RESOURCE_ENERGY), creep.room.controller ? EXTENSION_ENERGY_CAPACITY[creep.room.controller.level] : CARRY_CAPACITY)) {
        return "D";
      }
      return c.memory.mode;
    })(creep);
    if (creep.memory.mode !== newMode) {
      creep.say(newMode);
      creep.memory.mode = newMode;
      delete creep.memory.dismantleId;
      if (newMode === "G") {
        creep.memory.storeId = void 0;
      }
      if (newMode === "D") {
        (creep.room.memory.carrySize = creep.room.memory.carrySize || {}).gatherer = ((((_a2 = creep.room.memory.carrySize) == null ? void 0 : _a2.gatherer) || 100) * 100 + creep.store.energy) / 101;
      }
    }
  }
  checkMode2();
  const center = room.storage || getMainSpawn(room);
  if (!center) {
    return creep.say("center not found");
  }
  if (creep.memory.storeId) {
    const store = Game.getObjectById(creep.memory.storeId);
    if (!store || store && "store" in store && store.store.energy < CARRY_CAPACITY) {
      creep.memory.storeId = void 0;
    }
  }
  if (!creep.memory.storeId) {
    creep.memory.storeId = (_a = creep.pos.findClosestByPath(FIND_TOMBSTONES, {
      filter: (r) => {
        return r.store.getUsedCapacity() !== 0;
      }
    })) == null ? void 0 : _a.id;
  }
  if (!creep.memory.storeId) {
    creep.memory.storeId = (_b = _(creep.room.find(FIND_HOSTILE_STRUCTURES).filter((s) => "store" in s)).sortBy((s) => s.pos.getRangeTo(creep)).first()) == null ? void 0 : _b.id;
  }
  if (!creep.memory.storeId) {
    creep.memory.storeId = (_c = creep.pos.findClosestByPath(FIND_RUINS, {
      filter: (r) => {
        return r.store.getUsedCapacity() !== 0;
      }
    })) == null ? void 0 : _c.id;
  }
  if (!creep.memory.storeId && creep.memory.mode === "G") {
    const spawn = creep.pos.findClosestByPath(findMyStructures(creep.room).spawn);
    return (spawn == null ? void 0 : spawn.recycleCreep(creep)) === ERR_NOT_IN_RANGE && customMove(creep, spawn.pos);
  }
  if (creep.memory.storeId && creep.memory.mode === "G") {
    const dismantle = (creep.memory.dismantleId = creep.memory.dismantleId || ((_d = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES)) == null ? void 0 : _d.id)) && Game.getObjectById(creep.memory.dismantleId);
    if (dismantle) {
      if (creep.dismantle(dismantle) === ERR_NOT_IN_RANGE) {
        return moveMeTo(dismantle);
      }
    } else {
      delete creep.memory.dismantleId;
    }
    const store = Game.getObjectById(creep.memory.storeId);
    if (store) {
      if (!creep.pos.isNearTo(store)) {
        moveMeTo(store, { range: 1 });
      }
      if (creep.pos.isNearTo(store)) {
        const target = _(RESOURCES_ALL).filter((r) => (store.store.getUsedCapacity(r) || 0) > 0).sort((r1, r2) => (store.store.getUsedCapacity(r1) || 0) - (store.store.getUsedCapacity(r2) || 0)).first();
        creep.memory.worked = target && creep.withdraw(store, target, Math.min(store.store.getUsedCapacity(target) || 0, creep.store.getFreeCapacity(target)));
        switch (creep.memory.worked) {
          // 空の時
          case ERR_NOT_ENOUGH_RESOURCES:
            creep.memory.storeId = void 0;
            checkMode2();
            break;
          // お腹いっぱい
          case ERR_FULL:
            checkMode2();
            break;
          // 有りえない系
          case ERR_NOT_IN_RANGE:
          //先に判定してるのでないはず
          case ERR_NOT_OWNER:
          case ERR_INVALID_TARGET:
          case ERR_INVALID_ARGS:
            console.log(`${creep.name} withdraw returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}:${JSON.stringify(store)}`);
            creep.memory.storeId = void 0;
            creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
            break;
          // 問題ない系
          case OK:
          case ERR_BUSY:
          default:
            creep.memory.storeId = void 0;
            checkMode2();
            break;
        }
      }
    }
  }
  if (creep.memory.mode === "D") {
    if (!creep.pos.isNearTo(creep.room.storage)) {
      moveMeTo(creep.room.storage, { range: 1 });
    }
    if (creep.pos.isNearTo(creep.room.storage)) {
      const returnVal = _(RESOURCES_ALL).map((r) => {
        return creep.room.storage && creep.transfer(creep.room.storage, r);
      }).find((ret) => ret !== OK) || OK;
      switch (returnVal) {
        // 手持ちがない
        case ERR_NOT_ENOUGH_RESOURCES:
          checkMode2();
          break;
        // 対象が変
        // 有りえない系
        case ERR_INVALID_TARGET:
        // 対象が変
        case ERR_NOT_IN_RANGE:
        //先に判定してるのでないはず
        case ERR_NOT_OWNER:
        // 自creepじゃない
        case ERR_INVALID_ARGS:
          console.log(`${creep.name} transfer returns ${RETURN_CODE_DECODER[returnVal.toString()]}`);
          creep.say(RETURN_CODE_DECODER[returnVal.toString()]);
          break;
        // 問題ない系
        case OK:
        case ERR_BUSY:
        // spawining
        case ERR_FULL:
        // 満タン
        default:
          break;
      }
    }
  }
};
var role_gatherer_default = behavior8;
function isGatherer(creep) {
  return creep.memory.role === "gatherer";
}

// role.harvester.ts
var behavior9 = (creep) => {
  var _a, _b, _c;
  if (!isHarvester(creep)) {
    console.log(`${creep.name} is not harvester`);
    return ERR_INVALID_TARGET;
  }
  if (creep.room.name !== creep.memory.baseRoom) {
    return moveRoom(creep, creep.room.name, creep.memory.baseRoom);
  }
  const moveMeTo = (target, opt) => {
    var _a2;
    const pos = "pos" in target ? target.pos : target;
    (_a2 = Game.rooms[pos.roomName]) == null ? void 0 : _a2.visual.text("x", pos, {
      color: toColor(creep)
    });
    PathFinder.use(true);
    const result = customMove(creep, target, {
      maxRooms: 1,
      ...opt
    });
    PathFinder.use(false);
    return result;
  };
  const checkMode2 = () => {
    let newMode = creep.memory.mode;
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      newMode = "D";
    } else if (creep.store.energy === 0) {
      newMode = "H";
    }
    if (creep.memory.mode !== newMode) {
      creep.say(newMode);
      creep.memory.mode = newMode;
      delete creep.memory.transferId;
      delete creep.memory.harvestTargetId;
    }
  };
  checkMode2();
  const { container = [], link = [] } = findMyStructures(creep.room);
  if (!creep.memory.harvestTargetId || ((_a = Game.getObjectById(creep.memory.harvestTargetId)) == null ? void 0 : _a.energy) === 0) {
    delete creep.memory.harvestTargetId;
  }
  if (!creep.memory.harvestTargetId) {
    creep.memory.harvestTargetId = (_b = (getMainSpawn(creep.room) || creep).pos.findClosestByPath(FIND_SOURCES_ACTIVE)) == null ? void 0 : _b.id;
  }
  if (!creep.memory.harvestTargetId) {
    return ERR_NOT_FOUND;
  }
  if (creep.memory.mode === "D") {
    if (creep.memory.transferId) {
      const store2 = Game.getObjectById(creep.memory.transferId);
      if (store2 && "store" in store2 && store2.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        creep.memory.transferId = void 0;
      }
    }
    const mineral = _.first(creep.room.find(FIND_MINERALS));
    creep.memory.transferId = creep.memory.transferId || ((_c = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s) => {
        if ("store" in s) {
          const mineralContainer = container.filter((c) => !mineral || c.pos.inRangeTo(mineral, 3));
          return s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && !mineralContainer.find((c) => c.id === s.id);
        }
        return false;
      }
    })) == null ? void 0 : _c.id);
    const store = creep.memory.transferId && Game.getObjectById(creep.memory.transferId);
    if (store) {
      const returnVal = creep.transfer(store, RESOURCE_ENERGY);
      switch (returnVal) {
        // 対象が変
        case ERR_INVALID_TARGET:
        // 対象が変
        case ERR_FULL:
          creep.memory.transferId = void 0;
          break;
        case ERR_NOT_IN_RANGE:
          moveMeTo(store);
          break;
        // 有りえない系
        case ERR_NOT_OWNER:
        // 自creepじゃない
        case ERR_INVALID_ARGS:
          console.log(`${creep.name} transfer returns ${RETURN_CODE_DECODER[returnVal.toString()]}`);
          creep.say(RETURN_CODE_DECODER[returnVal.toString()]);
          break;
        // 問題ない系
        case OK:
        case ERR_NOT_ENOUGH_RESOURCES:
        // 値を指定しないから多分発生しない
        case ERR_BUSY:
        // spawining
        default:
          break;
      }
    } else {
      creep.memory.transferId = void 0;
    }
  } else {
    const source = Game.getObjectById(creep.memory.harvestTargetId);
    if (!source) {
      creep.memory.harvestTargetId = void 0;
      return;
    }
    creep.memory.worked = creep.harvest(source);
    if (!creep.pos.isNearTo(source)) {
      moveMeTo(source, {
        maxRooms: 0
      });
    }
    switch (creep.memory.worked) {
      case ERR_NOT_IN_RANGE:
        moveMeTo(source, {
          range: 1,
          maxRooms: 0
        });
        break;
      // 来ないはずのやつ
      case ERR_INVALID_TARGET:
      // 対象が変
      case ERR_NOT_OWNER:
      // 自creepじゃない
      case ERR_NOT_FOUND:
      // mineralは対象外
      case ERR_NO_BODYPART:
        console.log(`${creep.name} harvest returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
        creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
        break;
      // 大丈夫なやつ
      case OK:
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
        creep.memory.harvestTargetId = void 0;
        break;
      case ERR_TIRED:
      // 疲れた
      case ERR_BUSY:
      // spawning
      default:
        creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
        break;
    }
    if (creep.memory.worked === OK && source.pos.findInRange(
      [...source.room.find(FIND_CONSTRUCTION_SITES, { filter: (s) => s.structureType === STRUCTURE_CONTAINER }), ...container, ...link],
      1
    ).length === 0) {
      creep.pos.createConstructionSite(STRUCTURE_CONTAINER);
    }
  }
  let built = [];
  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.getActiveBodyparts(WORK) * BUILD_POWER) {
    built = _(
      creep.pos.findInRange(
        Object.values(Game.constructionSites).filter((s) => s.structureType === STRUCTURE_CONTAINER),
        3
      )
    ).sortBy((s) => s.progress - s.progressTotal).map((site) => creep.build(site)).run();
  }
  const repaired = _(
    creep.pos.findInRange(FIND_STRUCTURES, 3, {
      filter: (s) => s.structureType !== STRUCTURE_ROAD && "ticksToDecay" in s && s.hits < Math.min(s.hitsMax, 3e3)
    })
  ).map((damaged) => {
    return creep.repair(damaged);
  }).run();
  if (built.length === 0 && creep.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.getActiveBodyparts(WORK) * BUILD_POWER && repaired.length === 0) {
    if (creep.memory.mode === "H") {
      const source = creep.memory.harvestTargetId && Game.getObjectById(creep.memory.harvestTargetId);
      if (source) {
        let stores = source.pos.findInRange(link, 2);
        if (stores.length === 0) {
          stores = source.pos.findInRange(container, 2, {
            filter: (c) => c.store.getFreeCapacity(RESOURCE_ENERGY)
          });
        }
        const store = creep.pos.findClosestByRange(stores);
        if (store) {
          if (creep.transfer(store, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            moveMeTo(store, {
              maxRooms: 0
            });
          }
        }
      }
    }
  }
};
var role_harvester_default = behavior9;
function isHarvester(c) {
  return "role" in c.memory && c.memory.role === "harvester";
}

// role.labManager.ts
var behavior10 = (creep) => {
  var _a, _b, _c, _d, _e, _f;
  const { room } = creep;
  const terminal = room.terminal;
  if (!terminal) {
    return ERR_NOT_FOUND;
  }
  const moveMeTo = (target, opt) => customMove(creep, target, {
    swampCost: 1,
    plainCost: 1,
    ...opt
  });
  if (!isLabManager(creep)) {
    return console.log(`${creep.name} is not LabManager`);
  }
  function checkMode2() {
    if (!isLabManager(creep)) {
      return console.log(`${creep.name} is not LabManager`);
    }
    const newMode = creep.store.getUsedCapacity() === 0 ? "G" : "D";
    if (creep.memory.mode !== newMode) {
      creep.say(newMode);
      creep.memory.mode = newMode;
      if (newMode === "G") {
        creep.memory.storeId = void 0;
        creep.memory.mineralType = void 0;
      }
      creep.memory.transferId = void 0;
    }
  }
  checkMode2();
  const alpha = 1 / CREEP_LIFE_TIME;
  (creep.room.memory.carrySize = creep.room.memory.carrySize || {}).labManager = Math.max(
    100,
    (((_a = creep.room.memory.carrySize) == null ? void 0 : _a.labManager) || 100) * (1 - alpha) + creep.store.getUsedCapacity() * alpha
  );
  const { factory } = findMyStructures(creep.room);
  const labs = getLabs(room);
  if (creep.memory.storeId) {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store && "store" in store && store.store.energy < CARRY_CAPACITY) {
      creep.memory.storeId = void 0;
    }
  }
  const { wrong, requesting, completed } = labs.sortBy((l) => {
    if (l.memory.expectedType) {
      return l.store[l.memory.expectedType];
    } else {
      return Infinity;
    }
  }).reduce(
    (mapping, structure) => {
      if (!structure.memory.expectedType) {
        return mapping;
      }
      if (structure.mineralType) {
        if (structure.mineralType !== structure.memory.expectedType) {
          mapping.wrong.push(structure);
        } else if (isCompound(structure.mineralType)) {
          if (structure.store[structure.mineralType] > TRANSFER_THRESHOLD * 2) {
            mapping.completed.push(structure);
          } else if (structure.store[structure.mineralType] <= TRANSFER_THRESHOLD) {
            mapping.requesting.push(structure);
          } else {
            mapping.noProblem.push(structure);
          }
        } else {
          if (structure.store.getFreeCapacity(structure.mineralType) > 1e3) {
            mapping.requesting.push(structure);
          } else {
            mapping.noProblem.push(structure);
          }
        }
      } else {
        if (structure.memory.expectedType) {
          mapping.requesting.push(structure);
        } else {
          mapping.completed.push(structure);
        }
      }
      return mapping;
    },
    {
      completed: [],
      noProblem: [],
      requesting: [],
      wrong: []
    }
  );
  if (!creep.memory.storeId && wrong.length > 0) {
    const store = _(wrong).last();
    creep.memory.storeId = store == null ? void 0 : store.id;
    creep.memory.mineralType = (store == null ? void 0 : store.mineralType) || void 0;
  }
  if (!creep.memory.storeId) {
    const store = _(completed).first();
    creep.memory.storeId = store == null ? void 0 : store.id;
    creep.memory.mineralType = (store == null ? void 0 : store.mineralType) || void 0;
  }
  if (!creep.memory.storeId) {
    for (const req of requesting) {
      if (req.memory.expectedType) {
        const s = creep.pos.findClosestByPath(_.compact([creep.room.terminal, factory, creep.room.storage]), {
          filter: (s2) => s2.store.getUsedCapacity(req.memory.expectedType) > 0
        });
        if (s) {
          creep.memory.storeId = s == null ? void 0 : s.id;
          creep.memory.mineralType = req.memory.expectedType;
          break;
        }
      }
    }
  }
  creep.memory.balancing = false;
  if (Game.cpu.bucket > 500) {
    if (!creep.memory.storeId) {
      const balanceTarget = _([
        // ファクトリーで分配上限以上あるやつ
        ...RESOURCES_ALL.map((resourceType) => {
          return {
            resourceType,
            store: factory
          };
        }).filter((v) => {
          var _a2;
          return isCommodityIngredients(v.resourceType) && (((_a2 = v.store) == null ? void 0 : _a2.store[v.resourceType]) || 0) > _.ceil(TRANSFER_THRESHOLD, -2);
        }),
        // ターミナルで分配上限の2倍あるやつ
        ...RESOURCES_ALL.map((resourceType) => {
          return {
            resourceType,
            store: room.terminal
          };
        }).filter((v) => {
          var _a2;
          return (((_a2 = v.store) == null ? void 0 : _a2.store[v.resourceType]) || 0) > _.ceil(TRANSFER_THRESHOLD * 2, -2);
        })
      ]).first();
      if (balanceTarget) {
        creep.memory.storeId = (_b = balanceTarget.store) == null ? void 0 : _b.id;
        creep.memory.mineralType = balanceTarget.resourceType;
        creep.memory.balancing = true;
      }
    }
    if (!creep.memory.storeId) {
      const shortage = _([
        // ターミナルで分配上限2倍無いやつ
        ...RESOURCES_ALL.map((resourceType) => {
          return {
            resourceType,
            store: room.terminal
          };
        }).filter((v) => {
          var _a2, _b2;
          return (((_a2 = v.store) == null ? void 0 : _a2.store[v.resourceType]) || 0) <= _.floor(TRANSFER_THRESHOLD * 2, -2) && (((_b2 = room.storage) == null ? void 0 : _b2.store[v.resourceType]) || 0) > 0;
        }),
        // ファクトリーで分配上限以上無いやつ
        ...factory ? RESOURCES_ALL.map((resourceType) => {
          return {
            resourceType,
            store: factory
          };
        }).filter((v) => {
          var _a2, _b2;
          return (((_a2 = v.store) == null ? void 0 : _a2.store[v.resourceType]) || 0) <= _.floor(TRANSFER_THRESHOLD, -2) && (((_b2 = room.storage) == null ? void 0 : _b2.store[v.resourceType]) || 0) > 0;
        }) : []
      ]).first();
      if (shortage) {
        creep.memory.storeId = (_c = room.storage) == null ? void 0 : _c.id;
        creep.memory.mineralType = shortage.resourceType;
        creep.memory.balancing = true;
      }
    }
  }
  if (creep.memory.storeId && creep.memory.mode === "G") {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store) {
      if (!creep.pos.isNearTo(store)) {
        moveMeTo(store);
      }
      if (creep.pos.isNearTo(store)) {
        creep.memory.worked = ((creep2) => {
          if (creep2.memory.mineralType) {
            return creep2.withdraw(
              store,
              creep2.memory.mineralType,
              creep2.memory.balancing ? Math.min(
                store.store[creep2.memory.mineralType] - TRANSFER_THRESHOLD * (store.structureType === STRUCTURE_TERMINAL ? 2 : 1),
                creep2.store.getFreeCapacity(creep2.memory.mineralType)
              ) : void 0
            );
          } else {
            creep2.memory.storeId = void 0;
            creep2.memory.mineralType = void 0;
            return ERR_INVALID_ARGS;
          }
        })(creep);
        switch (creep.memory.worked) {
          // 空の時
          case ERR_NOT_ENOUGH_RESOURCES:
            creep.memory.storeId = void 0;
            checkMode2();
            break;
          // お腹いっぱい
          case ERR_FULL:
            checkMode2();
            break;
          // 有りえない系
          case ERR_NOT_IN_RANGE:
          //先に判定してるのでないはず
          case ERR_NOT_OWNER:
          case ERR_INVALID_TARGET:
          case ERR_INVALID_ARGS:
            console.log(`${creep.name} withdraw returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
            creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
            break;
          // 問題ない系
          case OK:
          case ERR_BUSY:
          default:
            creep.memory.storeId = void 0;
            checkMode2();
            break;
        }
      }
    }
  }
  const currentType = (_d = Object.entries(creep.store).find(([_type, amount]) => amount)) == null ? void 0 : _d[0];
  if (creep.memory.transferId) {
    const store = Game.getObjectById(creep.memory.transferId);
    if (store && "store" in store && store.store.getFreeCapacity(currentType) === 0) {
      creep.memory.transferId = void 0;
    }
  }
  if (!creep.memory.transferId) {
    if (!currentType) {
      return ERR_NOT_ENOUGH_RESOURCES;
    }
    if (!creep.memory.transferId) {
      creep.memory.transferId = (_e = requesting.find((lab) => lab.memory.expectedType === currentType)) == null ? void 0 : _e.id;
    }
    if (!creep.memory.transferId) {
      if (wrong.length > 0 || creep.memory.storeId !== terminal.id && terminal.store[currentType] < _.floor(TRANSFER_THRESHOLD * 2, -2)) {
        creep.memory.transferId = terminal.id;
      } else if (factory && creep.memory.storeId !== factory.id && factory.store[currentType] < _.floor(TRANSFER_THRESHOLD, -2)) {
        creep.memory.transferId = factory.id;
      } else {
        creep.memory.transferId = (_f = creep.room.storage) == null ? void 0 : _f.id;
      }
    }
  }
  if (creep.memory.transferId && creep.memory.mode === "D") {
    const transferTarget = Game.getObjectById(creep.memory.transferId);
    if (transferTarget) {
      if (!creep.pos.isNearTo(transferTarget)) {
        moveMeTo(transferTarget);
      }
      if (creep.pos.isNearTo(transferTarget)) {
        Object.keys(creep.store).map((resourceType) => {
          const returnVal = creep.transfer(transferTarget, resourceType);
          switch (returnVal) {
            // 手持ちがない
            case ERR_NOT_ENOUGH_RESOURCES:
              checkMode2();
              break;
            // 対象が変
            case ERR_INVALID_TARGET:
            // 対象が変
            case ERR_FULL:
              creep.memory.transferId = void 0;
              break;
            // 有りえない系
            case ERR_NOT_IN_RANGE:
            //先に判定してるのでないはず
            case ERR_NOT_OWNER:
            // 自creepじゃない
            case ERR_INVALID_ARGS:
              console.log(`${creep.name} transfer ${resourceType} returns ${RETURN_CODE_DECODER[returnVal.toString()]}`);
              creep.say(RETURN_CODE_DECODER[returnVal.toString()].replace("ERR_", ""));
              break;
            // 問題ない系
            case OK:
            case ERR_BUSY:
            // spawining
            default:
              break;
          }
        });
      }
    } else {
      creep.memory.transferId = void 0;
    }
  }
};
var role_labManager_default = behavior10;
function isLabManager(creep) {
  return creep.memory.role === "labManager";
}
function isCommodityIngredients(r) {
  return COMMODITY_INGREDIENTS.include(r);
}

// role.mineralHarvester.ts
var behavior11 = (creep) => {
  if (!isM(creep)) {
    return console.log(`${creep.name} is not MineralHarvester`);
  }
  const storage = creep.room.storage;
  if (!storage) {
    return creep.say("NO STORAGE");
  }
  if (boost2(creep) !== OK) {
    return;
  }
  const mineral = Game.getObjectById(creep.memory.targetId);
  if (!mineral) {
    return creep.suicide();
  }
  const checkMode2 = () => {
    const newMode = ((c) => {
      if (c.memory.mode !== "D" && c.memory.mode !== "G") {
        return "G";
      }
      if (c.memory.mode === "D" && c.store.getUsedCapacity() === 0) {
        return "G";
      }
      if (c.memory.mode === "G" && creep.store.getFreeCapacity(mineral.mineralType) < creep.body.reduce((total, b) => {
        if (b.type === WORK) {
          return total + HARVEST_MINERAL_POWER * (b.boost && REVERSE_BOOSTS.harvest[b.boost] || 1);
        }
        return total;
      }, 0)) {
        return "D";
      }
      return c.memory.mode;
    })(creep);
    if (newMode !== creep.memory.mode) {
      creep.memory.mode = newMode;
      creep.memory.storeId = void 0;
      creep.memory.pickUpId = void 0;
      creep.say(creep.memory.mode);
    }
  };
  checkMode2();
  if (creep.memory.mode === "D") {
    delivery(creep);
  } else {
    work(creep);
  }
};
var role_mineralHarvester_default = behavior11;
function isM(c) {
  return c.memory.role === "mineralHarvester";
}
function work(creep) {
  var _a;
  creep.memory.pickUpId = creep.memory.pickUpId || ((_a = creep.pos.findClosestByPath(creep.room.find(FIND_DROPPED_RESOURCES, { filter: (r) => r.resourceType !== RESOURCE_ENERGY }))) == null ? void 0 : _a.id);
  if (creep.memory.pickUpId) {
    const resource = Game.getObjectById(creep.memory.pickUpId);
    if (resource) {
      const picked = creep.pickup(resource);
      switch (creep.pickup(resource)) {
        // 遠い
        case ERR_NOT_IN_RANGE:
          customMove(creep, resource);
          break;
        // 問題ない系
        case OK:
          break;
        // それ以外のよくわからないやつは初期化
        default:
          creep.memory.pickUpId = void 0;
      }
      return picked;
    } else {
      creep.memory.pickUpId = void 0;
    }
  }
  const mineral = Game.getObjectById(creep.memory.targetId);
  if (!mineral) {
    return creep.suicide();
  }
  creep.memory.worked = creep.harvest(mineral);
  switch (creep.memory.worked) {
    case ERR_NOT_IN_RANGE:
      customMove(creep, mineral, {
        range: 1
      });
      break;
    // 来ないはずのやつ
    case ERR_INVALID_TARGET:
    // 対象が変
    case ERR_NOT_OWNER:
    // 自creepじゃない
    case ERR_NOT_FOUND:
    // mineralは対象外
    case ERR_NO_BODYPART:
      console.log(`${creep.name} harvest returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
      creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
      break;
    // 大丈夫なやつ
    case OK:
    // OK
    case ERR_NOT_ENOUGH_RESOURCES:
    // 空っぽ
    case ERR_TIRED:
      break;
    case ERR_BUSY:
    // spawning
    default:
      creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
      break;
  }
}
function delivery(creep) {
  if (!creep.room.storage) {
    return ERR_NOT_FOUND;
  }
  const mineral = _.first(creep.room.find(FIND_MINERALS));
  if (!mineral) {
    return ERR_NOT_FOUND;
  }
  let storage = creep.room.storage;
  if (creep.room.terminal && creep.room.terminal.store[mineral.mineralType] < TRANSFER_THRESHOLD * 2) {
    storage = creep.room.terminal;
  }
  const { factory } = findMyStructures(creep.room);
  if (factory && factory.store[mineral.mineralType] < TRANSFER_THRESHOLD) {
    storage = factory;
  }
  if (!storage) {
    return creep.say("NO STORAGE");
  }
  const returns = RESOURCES_ALL.map((r) => creep.transfer(storage, r));
  if (RESOURCES_ALL.map((r) => creep.transfer(storage, r)).find((ret) => ret === ERR_NOT_IN_RANGE)) {
    return customMove(creep, storage, {
      range: 1
    });
  }
  return returns.find((r) => r !== OK) || OK;
}
var BOOSTS2 = [RESOURCE_CATALYZED_UTRIUM_ALKALIDE, RESOURCE_UTRIUM_ALKALIDE, RESOURCE_UTRIUM_OXIDE];
function boost2(creep) {
  var _a;
  if (creep.body.filter((b) => b.type === WORK && !b.boost).length === 0) {
    return OK;
  }
  const labs = getLabs(creep.room);
  const target = (_a = labs.filter((l) => {
    return l.memory.expectedType && // eslint-disable-next-line @typescript-eslint/no-explicit-any
    BOOSTS2.includes(l.memory.expectedType) && l.store.getUsedCapacity(l.memory.expectedType) >= LAB_BOOST_MINERAL * creep.body.filter((b) => b.type === WORK && !b.boost).length;
  }).sort((l) => {
    const idx = l.memory.expectedType && BOOSTS2.findIndex((b) => b === l.memory.expectedType) || -1;
    if (idx > 0) {
      return idx;
    } else {
      return Infinity;
    }
  }).run()) == null ? void 0 : _a[0];
  if (!target) {
    return OK;
  }
  const result = target.boostCreep(creep);
  if (result === ERR_NOT_IN_RANGE) {
    customMove(creep, target);
  }
  return result;
}

// role.upgrader.ts
var behavior12 = (creep) => {
  var _a, _b, _c, _d, _e;
  const moveMeTo = (target, opt) => customMove(creep, target, {
    ...opt
  });
  if (!isUpgrader(creep)) {
    return console.log(`${creep.name} is not Upgrader`);
  }
  const controller = (_a = Game.rooms[creep.memory.baseRoom]) == null ? void 0 : _a.controller;
  if (!controller) {
    return creep.suicide();
  }
  if (boost3(creep) !== OK) {
    return;
  }
  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    changeMode(creep, "W");
  } else if (creep.store.energy === 0) {
    changeMode(creep, "G");
  }
  const { link, container } = findMyStructures(creep.room);
  const links = link.filter((l) => {
    const s = getMainSpawn(creep.room);
    return !(s && l.pos.inRangeTo(s, 1));
  });
  if (((_b = controller.sign) == null ? void 0 : _b.username) !== "Nekane" || ((_c = controller.sign) == null ? void 0 : _c.text) !== SIGN) {
    const signed = creep.signController(controller, SIGN);
    if (signed === ERR_NOT_IN_RANGE) {
      moveMeTo(controller);
    } else {
      console.log(`${creep.name}:${RETURN_CODE_DECODER[signed.toString()]}`);
    }
  }
  const myContainer = controller.pos.findClosestByRange(container, {
    filter: (c) => {
      return c.pos.inRangeTo(controller, 3);
    }
  });
  if (controller.ticksToDowngrade < 1e3 || getSitesInRoom(controller.room).length === 0 || myContainer && getCapacityRate(myContainer, RESOURCE_ENERGY) > 0.5) {
    creep.memory.worked = creep.upgradeController(controller);
    switch (creep.memory.worked) {
      // 資源不足
      case ERR_NOT_ENOUGH_RESOURCES:
        changeMode(creep, "G");
        break;
      case ERR_NOT_IN_RANGE:
        if (creep.memory.mode === "W") {
          moveMeTo(controller, { range: 3 });
        }
        break;
      // 有りえない系
      case ERR_NOT_OWNER:
      case ERR_INVALID_TARGET:
      case ERR_NO_BODYPART:
        console.log(`${creep.name} upgradeController returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
        creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
        break;
      // 問題ない系
      case OK:
      case ERR_BUSY:
      default:
        break;
    }
  }
  if (creep.memory.storeId && (((_d = Game.getObjectById(creep.memory.storeId)) == null ? void 0 : _d.store.energy) || 0) <= 0) {
    creep.memory.storeId = void 0;
  }
  if (creep.memory.storeId || (creep.memory.storeId = (_e = _([...links, ...container]).compact().filter((c) => {
    var _a2;
    return c.store.energy > 0 && ((_a2 = c.room.controller) == null ? void 0 : _a2.pos.inRangeTo(c, 3));
  }).sort((c) => {
    switch (c.structureType) {
      case "link":
        return 0;
      default:
        return 1;
    }
  }).first()) == null ? void 0 : _e.id)) {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store) {
      creep.memory.collected = creep.withdraw(store, RESOURCE_ENERGY);
      switch (creep.memory.collected) {
        case ERR_INVALID_TARGET:
          creep.memory.storeId = void 0;
          break;
        // 満タンまで取った
        case ERR_FULL:
          changeMode(creep, "W");
          break;
        case ERR_NOT_IN_RANGE:
          if (creep.memory.mode === "G") {
            const moved = moveMeTo(store);
            if (moved !== OK) {
              console.log(`${creep.name} ${RETURN_CODE_DECODER[moved.toString()]}`);
              creep.say(RETURN_CODE_DECODER[moved.toString()]);
            }
          }
          break;
        // 有りえない系
        case ERR_NOT_OWNER:
        case ERR_INVALID_ARGS:
          console.log(`${creep.name} build returns ${creep.memory.worked && RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
          if (creep.memory.worked) {
            creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
          }
          break;
        // 問題ない系
        case OK:
        case ERR_BUSY:
        case ERR_NOT_ENOUGH_RESOURCES:
        // 空っぽ
        default:
          break;
      }
    }
  }
  pickUpAll(creep);
};
var role_upgrader_default = behavior12;
function isUpgrader(creep) {
  return creep.memory.role === "upgrader";
}
var changeMode = (creep, mode) => {
  if (mode !== creep.memory.mode) {
    creep.say(mode);
    creep.memory.storeId = void 0;
    creep.memory.mode = mode;
  }
};
var BOOSTS3 = [RESOURCE_CATALYZED_GHODIUM_ACID, RESOURCE_GHODIUM_ACID, RESOURCE_GHODIUM_HYDRIDE];
function boost3(creep) {
  var _a;
  const minBoosted = _(creep.body.filter((b) => b.type === WORK)).min((b) => (b.boost || "").length).boost;
  if (minBoosted === RESOURCE_CATALYZED_GHODIUM_ACID || minBoosted === RESOURCE_GHODIUM_ACID) {
    return OK;
  }
  const labs = getLabs(creep.room);
  const target = (_a = labs.filter((l) => {
    return l.memory.expectedType && BOOSTS3.includes(l.memory.expectedType) && l.store.getUsedCapacity(l.memory.expectedType) > LAB_BOOST_MINERAL;
  }).sort((l) => {
    const idx = l.memory.expectedType && BOOSTS3.findIndex((b) => b === l.memory.expectedType) || -1;
    if (idx > 0) {
      return idx;
    } else {
      return Infinity;
    }
  }).run()) == null ? void 0 : _a[0];
  if (!target) {
    return OK;
  }
  const result = target.boostCreep(creep);
  if (result === ERR_NOT_IN_RANGE) {
    customMove(creep, target);
  }
  return result;
}
var SIGN = "Please see github nekane1117/screeps";

// roles.ts
var behaviors = {
  builder: role_builder_default,
  carrier: role_carrier_default,
  claimer: role_claimer_default,
  gatherer: role_gatherer_default,
  defender: role_defender_default,
  harvester: role_harvester_default,
  labManager: role_labManager_default,
  mineralHarvester: role_mineralHarvester_default,
  upgrader: role_upgrader_default
};

// room.labManager.ts
function behavior13(labs, mineral) {
  var _a;
  const firstLab = _.first(labs);
  const room = firstLab == null ? void 0 : firstLab.room;
  if (!firstLab || !room) {
    return;
  }
  firstLab.room.memory.labs = firstLab.room.memory.labs || {};
  const labId = labs.map((lab) => lab.id);
  Object.keys(firstLab.room.memory.labs).forEach((id) => {
    if (!labId.includes(id) && mineral.room) {
      delete mineral.room.memory.labs[id];
    }
  });
  const { labManager = [] } = getCreepsInRoom(firstLab.room);
  if (firstLab.room.terminal && firstLab.room.terminal.store.energy > TRANSFER_THRESHOLD && firstLab.room.energyAvailable === firstLab.room.energyCapacityAvailable && labManager.length === 0) {
    const spawn = (_a = getSpawnsInRoom(firstLab.pos.roomName)) == null ? void 0 : _a.find((s) => !s.spawning);
    if (spawn) {
      spawn.spawnCreep(getManagerBody(firstLab.room), `Lm_${firstLab.room.name}_${Game.time}`, {
        memory: {
          baseRoom: firstLab.room.name,
          mode: "G",
          role: "labManager"
        }
      });
    }
  }
  const labWithMemory = labs.map((lab) => {
    const memory = lab.room.memory.labs[lab.id] || (lab.room.memory.labs[lab.id] = { expectedType: void 0 });
    return Object.assign(lab, { memory });
  });
  if (Game.time % (CREEP_LIFE_TIME / 3) === 0) {
    room.memory.labMode = checkMode(room);
    const finalProducts = _.clone(LAB_STRATEGY[room.memory.labMode]);
    if (!finalProducts) {
      console.log("strategy is not defined: " + room.memory.labMode);
      return ERR_INVALID_ARGS;
    }
    const strategy = _(generateStrategy(room, [finalProducts]).reverse()).uniq().run();
    delete room.memory.labStrategy;
    labWithMemory.forEach((lab, i) => {
      lab.memory.expectedType = strategy[i];
    });
  }
  labWithMemory.map((lab) => {
    if (lab.memory.expectedType) {
      lab.room.visual.text(lab.memory.expectedType, lab.pos.x, lab.pos.y, {
        color: "#ffff00",
        font: 0.75,
        strokeWidth: 2
      });
    }
    const ingredients = lab.memory.expectedType && REVERSE_REACTIONS[lab.memory.expectedType];
    if ((!lab.mineralType || lab.mineralType === lab.memory.expectedType) && ingredients) {
      const [l1, l2] = ingredients.map((type) => {
        return labWithMemory.find((l) => {
          return l.mineralType === type && l.store[type] >= LAB_REACTION_AMOUNT;
        });
      });
      if (l1 && l2) {
        lab.runReaction(l1, l2);
      }
    }
    return;
  });
}
function checkMode(room) {
  const {
    builder = []
    // mineralHarvester = []
  } = getCreepsInRoom(room);
  if (!isBoosted2(builder)) {
    return "builder";
  } else {
    return "upgrader";
  }
}
function isBoosted2(creeps) {
  return creeps.length === 0 || creeps.every(
    (c) => c.body.filter((b) => {
      return b.type === WORK;
    }).every((b) => !!b.boost)
  );
}
function generateStrategy(room, strategy) {
  const last = _.last(strategy);
  if (!last) {
    return strategy;
  }
  const roomResouces = getRoomResouces(room);
  if ((roomResouces[last] || 0) > 1e3) {
    return strategy;
  }
  const reverseReactions = REVERSE_REACTIONS[last];
  if (!reverseReactions) {
    return strategy;
  }
  const [left, right] = reverseReactions;
  if (!isCompound(left) && !isCompound(right)) {
    return strategy.concat(right, left);
  }
  const labs = getLabs(room);
  if (labs.size() <= 3 && last === RESOURCE_GHODIUM && (roomResouces[left] || 0) >= 1e3 && (roomResouces[right] || 0) < 1e3) {
    return generateStrategy(room, strategy.concat(right));
  }
  return generateStrategy(room, generateStrategy(room, strategy.concat(right)).concat(left));
}
function getManagerBody(room) {
  var _a;
  const safetyFactor = 2;
  const bodyCycle = [MOVE, CARRY, CARRY];
  let costTotal = 0;
  const avgSize = ((_a = room.memory.carrySize) == null ? void 0 : _a.labManager) || 100;
  return _.range(Math.ceil(avgSize / CARRY_CAPACITY) * safetyFactor * 3).slice(0, 50).map((i) => {
    const parts = bodyCycle[i % bodyCycle.length];
    costTotal += BODYPART_COST[parts];
    return { parts, costTotal };
  }).filter((p) => p.costTotal <= room.energyAvailable).map((p) => p.parts);
}

// structure.links.ts
function behavior14(links) {
  var _a, _b;
  const room = (_a = _.first(links)) == null ? void 0 : _a.room;
  const center = room && (room.storage || getMainSpawn(room));
  if (!center) {
    return;
  }
  const controllerLink = findMyStructures(room).link.find((l) => room.controller && l.pos.inRangeTo(room.controller.pos, 3) && !l.pos.inRangeTo(center, 3));
  const [centerLink, ...tail] = _(links).filter((l) => l.id !== (controllerLink == null ? void 0 : controllerLink.id)).sortBy((l) => {
    return l.pos.getRangeTo(center);
  }).value();
  tail.reverse().forEach((l) => {
    if (l.cooldown === 0 && l.store.energy >= 100) {
      l.transferEnergy(centerLink, _.floor(Math.min(l.store.energy, centerLink.store.getFreeCapacity(RESOURCE_ENERGY)), -2));
    }
  });
  if (centerLink && (((_b = room.storage) == null ? void 0 : _b.store.energy) || 0) > TRANSFER_THRESHOLD * 2 && getCapacityRate(centerLink) > 0.5 && controllerLink) {
    centerLink.transferEnergy(controllerLink, _.floor(Math.min(centerLink.store.energy, controllerLink.store.getFreeCapacity(RESOURCE_ENERGY)), -2));
  }
}

// room.ts
function roomBehavior(room) {
  var _a, _b, _c;
  if (room.find(FIND_HOSTILE_CREEPS).length && !((_a = room.controller) == null ? void 0 : _a.safeMode) && room.energyAvailable > SAFE_MODE_COST) {
    (_b = room.controller) == null ? void 0 : _b.activateSafeMode();
  }
  if (!room.memory.carrySize) {
    room.memory.carrySize = {
      builder: 100,
      carrier: 100,
      claimer: 100,
      defender: 100,
      harvester: 100,
      labManager: 100,
      mineralHarvester: 100,
      upgrader: 100
    };
  }
  const { carrier: carriers = [], harvester = [], gatherer = [] } = getCreepsInRoom(room);
  if (room.storage) {
    room.visual.text(room.storage.store.energy.toString(), room.storage.pos.x, room.storage.pos.y, {
      font: 0.25
    });
  }
  const sources = room.find(FIND_SOURCES);
  if (sources.length > 0) {
    if (harvester.filter((h) => (h.ticksToLive || Infinity) > h.body.length * CREEP_SPAWN_TIME).length === 0) {
      const spawn = (() => {
        const spawns = getSpawnsInRoom(room);
        if (spawns.length > 0) {
          return spawns.find((s) => !s.spawning);
        } else {
          return logUsage(
            "find spawn",
            () => _(Object.values(Game.spawns)).filter((s) => s.room.energyAvailable === s.room.energyCapacityAvailable).map((spawn2) => {
              return {
                spawn: spawn2,
                cost: PathFinder.search(sources[0].pos, spawn2.pos).cost
              };
            }).min((v) => v.cost).spawn
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
        const bodies = (sources.length === 1 || spawn.room.energyCapacityAvailable < dynamicMinCost ? [WORK, MOVE, CARRY, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE] : _(_.range(50 / 3)).map(() => [WORK, MOVE, CARRY]).flatten().run()).slice(0, 50).map((body) => {
          return {
            body,
            total: total += BODYPART_COST[body]
          };
        }).filter((v) => v.total <= spawn.room.energyAvailable).map((v) => v.body);
        const spawned = spawn.spawnCreep(bodies, name, {
          memory: {
            role: "harvester",
            mode: "H",
            baseRoom: room.name
          }
        });
        if (spawned !== OK) {
          console.log(`spawn ${spawn.name}:${RETURN_CODE_DECODER[spawned]}: ${JSON.stringify(bodies)}`);
        }
      }
    }
  }
  logUsage("updateRoadMap", () => updateRoadMap(room));
  logUsage("labManager", () => {
    const { lab } = findMyStructures(room);
    const mineral = _(room.find(FIND_MINERALS)).first();
    if (mineral) {
      behavior13(lab, mineral);
    }
  });
  logUsage("createStructures", () => {
    if (room.name === "sim" || Game.time % 100 === 0) {
      createStructures(room);
    }
  });
  behavior14(findMyStructures(room).link);
  const carrierBodies = getCarrierBody(room, "carrier");
  if (harvester.length === 0) {
    return ERR_NOT_FOUND;
  }
  if (carriers.filter((g) => {
    return carrierBodies.length * CREEP_SPAWN_TIME < (g.ticksToLive || Infinity);
  }).length < 1) {
    const name = `C_${room.name}_${Game.time}`;
    const spawn = _(getSpawnsInRoom(room)).filter((s) => !s.spawning).first();
    if (spawn && !spawn.spawning && room.energyAvailable > 200) {
      spawn.spawnCreep(carrierBodies, name, {
        memory: {
          mode: "G",
          baseRoom: spawn.room.name,
          role: "carrier"
        }
      });
      return OK;
    }
  }
  if (room.energyAvailable >= room.energyCapacityAvailable * 0.9 && (((_c = getCreepsInRoom(room).defender) == null ? void 0 : _c.length) || 0) === 0 && room.find(FIND_HOSTILE_CREEPS).length > 0) {
    const spawn = _(getSpawnsInRoom(room)).filter((s) => !s.spawning).first();
    if (spawn) {
      return spawn.spawnCreep(filterBodiesByCost("defender", room.energyAvailable).bodies, `D_${room.name}_${Game.time}`, {
        memory: {
          baseRoom: room.name,
          role: "defender"
        }
      });
    } else {
      console.log("can't find spawn for defender");
    }
  }
  if (checkSpawnBuilder(room)) {
    const spawn = (() => {
      var _a2;
      const spawns = getSpawnsInRoom(room);
      if ((((_a2 = room.controller) == null ? void 0 : _a2.level) || 0) < 2 && spawns.length > 0) {
        return spawns.find((s) => !s.spawning && s.room.energyAvailable === s.room.energyCapacityAvailable);
      } else {
        return _(Object.values(Game.spawns)).map((spawn2) => {
          return {
            spawn: spawn2,
            cost: room.controller ? PathFinder.search(room.controller.pos, spawn2.pos).cost : Infinity
          };
        }).filter((v) => _.isFinite(v.cost)).min((v) => v.cost).spawn;
      }
    })();
    if (spawn && spawn.room.energyAvailable === spawn.room.energyCapacityAvailable) {
      spawn.spawnCreep(filterBodiesByCost("builder", spawn.room.energyCapacityAvailable).bodies, `B_${room.name}_${Game.time}`, {
        memory: {
          mode: "G",
          baseRoom: room.name,
          role: "builder"
        }
      });
    }
  }
  if (gatherer.length === 0 && room.storage && room.storage.my && room.energyCapacityAvailable >= 300 && (room.find(FIND_HOSTILE_STRUCTURES, { filter: (s) => !("store" in s) || s.store.getUsedCapacity() === 0 }).length > 0 || room.find(FIND_RUINS, { filter: (r) => r.store.getUsedCapacity() - r.store.energy > 0 }).length > 0 || room.find(FIND_TOMBSTONES, { filter: (r) => r.store.getUsedCapacity() - r.store.energy > 0 }).length > 0)) {
    const spawn = getSpawnsInRoom(room).find((s) => !s.spawning);
    if (spawn) {
      spawn.spawnCreep(filterBodiesByCost("gatherer", room.energyCapacityAvailable).bodies, `G_${room.name}_${Game.time}`, {
        memory: {
          role: "gatherer",
          baseRoom: room.name,
          mode: "G"
        }
      });
    }
  }
}
function createStructures(room) {
  const mainSpawn = getMainSpawn(room);
  if (!mainSpawn) {
    return;
  }
  const { extractor } = findMyStructures(room);
  const { extractor: extractorSite = [] } = _(getSitesInRoom(room)).groupBy((s) => s.structureType).value();
  if (!room.controller) {
    return;
  }
  if (CONTROLLER_STRUCTURES[STRUCTURE_EXTRACTOR][room.controller.level] && extractorSite.length === 0 && !extractor) {
    const mineral = _(room.find(FIND_MINERALS)).first();
    if (mineral) {
      mineral.pos.createConstructionSite(STRUCTURE_EXTRACTOR);
    }
  }
  const getDiffPosition = (dx, dy) => {
    return room.getPositionAt(mainSpawn.pos.x + dx, mainSpawn.pos.y + dy);
  };
  STATIC_STRUCTURES.forEach(({ dx, dy, structureType }) => {
    const pos = getDiffPosition(dx, dy);
    if (pos) {
      const built = pos.lookFor(LOOK_STRUCTURES);
      if (built.filter((s) => s.structureType !== STRUCTURE_ROAD && s.structureType !== structureType).length > 0) {
        built.forEach((b) => b.destroy());
      }
      if (structureType && !built.find((s) => s.structureType === structureType)) {
        pos.createConstructionSite(structureType);
      }
    }
  });
  for (const structureType of [STRUCTURE_OBSERVER, STRUCTURE_EXTENSION, STRUCTURE_TOWER]) {
    const structures2 = _([findMyStructures(room)[structureType]]).flatten().value();
    const sites = getSitesInRoom(room).filter((s) => s.structureType === structureType);
    if (structures2.length + sites.length < CONTROLLER_STRUCTURES[structureType][room.controller.level]) {
      const isOdd = !!((mainSpawn.pos.x + mainSpawn.pos.y) % 2);
      PathFinder.use(true);
      const pos = (room.storage || mainSpawn).pos.findClosestByPath(
        // 全部の場所
        _(2500).range().filter((i) => {
          const [x, y] = [i % 50, Math.floor(i / 50)];
          return isOdd === !!((x + y) % 2) && !STATIC_STRUCTURES.find(({ dx, dy }) => {
            return x === mainSpawn.pos.x + dx && y === mainSpawn.pos.y + dy;
          });
        }).map((i) => {
          return room.getPositionAt(i % 50, Math.floor(i / 50));
        }).compact().filter((p) => {
          return _(p.lookFor(LOOK_TERRAIN)).first() !== "wall" && ![...p.lookFor(LOOK_STRUCTURES), ...p.lookFor(LOOK_CONSTRUCTION_SITES)].find((s) => {
            return s.structureType !== STRUCTURE_ROAD;
          });
        }).value(),
        {
          plainCost: 1,
          swampCost: 1
        }
      );
      PathFinder.use(false);
      pos == null ? void 0 : pos.createConstructionSite(structureType);
    }
  }
}
function updateRoadMap(room) {
  var _a;
  const { road: roads, spawn, source } = findMyStructures(room);
  room.memory.roadMap = (room.memory.roadMap || _.range(2500).map(() => 0)).map((usage, i) => {
    const value = Math.min(10, Math.max(-10, usage - 10 / 2e3));
    const x = i % 50;
    const y = Math.floor(i / 50);
    if (value > 0) {
      room.visual.text(_.ceil(value, 0).toString(), x, y, {
        opacity: 0.55,
        font: 0.25
      });
    }
    if (Game.time % 600 === 0) {
      const pos = room.getPositionAt(x, y);
      if (pos) {
        const road = _([
          ...roads.filter((r) => r.pos.x === x && r.pos.y === y),
          ...Object.values(Game.constructionSites).filter(
            (s) => {
              var _a2;
              return ((_a2 = s.room) == null ? void 0 : _a2.name) === room.name && s.structureType === STRUCTURE_ROAD && s.pos.x === x && s.pos.y === y;
            }
          )
        ]).compact().find((s) => s.structureType === STRUCTURE_ROAD);
        if (!road && Math.ceil(value) >= 10 && pos.findInRange([...source, ...roads, ...spawn, ...room.find(FIND_MY_STRUCTURES)], 3).length > 0) {
          pos.createConstructionSite(STRUCTURE_ROAD);
        }
      }
    }
    return value;
  });
  (_a = room.memory.staticRoad) == null ? void 0 : _a.map((s) => {
    room.memory.roadMap[s.y * 50 + s.x] = 10;
  });
}
var STATIC_STRUCTURES = [
  { dy: -2, dx: 2, structureType: void 0 },
  { dy: -2, dx: 3, structureType: void 0 },
  { dy: -2, dx: 4, structureType: void 0 },
  { dy: -1, dx: -1, structureType: STRUCTURE_SPAWN },
  { dy: -1, dx: 1, structureType: void 0 },
  { dy: -1, dx: 2, structureType: STRUCTURE_LAB },
  { dy: -1, dx: 3, structureType: STRUCTURE_LAB },
  { dy: -1, dx: 4, structureType: STRUCTURE_LAB },
  { dy: -1, dx: 5, structureType: void 0 },
  { dy: 0, dx: -2, structureType: STRUCTURE_SPAWN },
  { dy: 0, dx: 1, structureType: void 0 },
  { dy: 0, dx: 2, structureType: STRUCTURE_LAB },
  { dy: 0, dx: 3, structureType: STRUCTURE_LAB },
  { dy: 0, dx: 4, structureType: STRUCTURE_LAB },
  { dy: 0, dx: 5, structureType: void 0 },
  { dy: 1, dx: -1, structureType: STRUCTURE_STORAGE },
  { dy: 1, dx: 1, structureType: STRUCTURE_TERMINAL },
  { dy: 1, dx: 3, structureType: STRUCTURE_LAB },
  { dy: 1, dx: 4, structureType: STRUCTURE_LAB },
  { dy: 1, dx: 5, structureType: void 0 },
  { dy: 2, dx: -2, structureType: STRUCTURE_POWER_SPAWN },
  { dy: 2, dx: -1, structureType: STRUCTURE_FACTORY },
  { dy: 2, dx: 0, structureType: STRUCTURE_LINK },
  { dy: 2, dx: 2, structureType: void 0 },
  { dy: 2, dx: 4, structureType: void 0 },
  { dy: 3, dx: 1, structureType: STRUCTURE_NUKER }
];
function checkSpawnBuilder(room) {
  const { builder = [], harvester = [] } = getCreepsInRoom(room);
  if (harvester.length === 0 || room.energyAvailable < room.energyCapacityAvailable) {
    return false;
  }
  const { bodies: builderBodies } = filterBodiesByCost("builder", room.energyCapacityAvailable);
  return builder.filter((g) => {
    return builderBodies.length * CREEP_SPAWN_TIME < (g.ticksToLive || Infinity);
  }).length < 1;
}
var dynamicMinCost = 1e3;

// structure.controller.ts
var behavior15 = (controller) => {
  var _a;
  if (!isC(controller)) {
    return console.log("type is invalid", controller);
  }
  const showSummary = (texts) => {
    texts.forEach((text, i) => {
      const center = getMainSpawn(controller.room) || controller;
      controller.room.visual.text(text, Math.max(center.pos.x - 3, 1), Math.max(1, center.pos.y - 3 - texts.length + i), { align: "left" });
    });
  };
  showSummary([
    `energy  : ${controller.room.energyAvailable} / ${controller.room.energyCapacityAvailable}`,
    `bucket  : ${(_a = Game.cpu.bucket) == null ? void 0 : _a.toLocaleString()}`,
    `progress:${(controller.progressTotal - controller.progress).toLocaleString()}`
  ]);
  updateUpgraderSize(controller.room);
  const { harvester = [], carrier = [] } = getCreepsInRoom(controller.room);
  const { container } = findMyStructures(controller.room);
  const containerSite = getSitesInRoom(controller.room).filter((s) => s.structureType === STRUCTURE_CONTAINER);
  const mainSpawn = getMainSpawn(controller.room);
  if (mainSpawn) {
    const myContainer = controller.pos.findClosestByRange([...container, ...containerSite], {
      filter: (s) => controller.pos.inRangeTo(s, 3)
    });
    const upgraderBody = getUpgraderBody(controller.room);
    if (myContainer) {
      if (harvester.length > 0 && carrier.length > 0 && upgraderBody.length && controller.room.energyAvailable === controller.room.energyCapacityAvailable) {
        const spawn = _(getSpawnsInRoom(controller.room)).find((s) => !s.spawning);
        if (spawn) {
          spawn.spawnCreep(upgraderBody, `U_${controller.room.name}_${Game.time}`, {
            memory: {
              baseRoom: controller.room.name,
              mode: "G",
              role: "upgrader"
            }
          });
        }
      }
    } else {
      const terrain = controller.room.getTerrain();
      const firstStep = controller.pos.findPathTo(mainSpawn).find((p) => terrain.get(p.x, p.y) !== TERRAIN_MASK_WALL);
      if (firstStep) {
        new RoomPosition(firstStep.x, firstStep.y, controller.room.name).createConstructionSite(STRUCTURE_CONTAINER);
      }
    }
  }
};
var structure_controller_default = behavior15;
function isC(s) {
  return s.structureType === STRUCTURE_CONTROLLER;
}
function updateUpgraderSize(room) {
  const memory = room.memory;
  if (!memory.carrySize) {
    memory.carrySize = {};
  }
  if (!memory.carrySize.upgrader) {
    memory.carrySize.upgrader = 50;
  }
  const border = CREEP_LIFE_TIME / 4;
  memory.carrySize.upgrader = (memory.carrySize.upgrader * border + _(room.getEventLog()).map((e) => e.event === EVENT_UPGRADE_CONTROLLER && e.data.energySpent).compact().sum()) / (border + 1);
}
var SIZE_FACTOR = 2;
function getUpgraderBody(room) {
  var _a, _b;
  const { upgrader = [] } = getCreepsInRoom(room);
  if (((_a = room.controller) == null ? void 0 : _a.level) === 8 && upgrader.length === 0) {
    return [MOVE, WORK, CARRY];
  }
  if (upgrader.length >= 1) {
    return [];
  }
  const requestUnit = Math.min((((_b = room.memory.carrySize) == null ? void 0 : _b.upgrader) || 1) * SIZE_FACTOR, 20) / 3;
  let totalCost = 0;
  if (requestUnit <= 0) {
    return [];
  } else {
    return _([CARRY, MOVE]).concat(
      ..._.range(requestUnit).map(() => {
        return [WORK, WORK, WORK, MOVE];
      })
    ).flatten().map((parts) => {
      totalCost += BODYPART_COST[parts];
      return {
        parts,
        totalCost
      };
    }).filter((p) => {
      return p.totalCost <= room.energyAvailable;
    }).map((p) => p.parts).value();
  }
}

// structure.extructor.ts
function behavior16(extractor) {
  if (!isE(extractor)) {
    return console.log("type is invalid", JSON.stringify(extractor));
  }
  const mineral = _(extractor.pos.lookFor(LOOK_MINERALS)).first();
  if (!mineral || mineral.ticksToRegeneration || !extractor.room.terminal) {
    return ERR_NOT_FOUND;
  }
  const { mineralHarvester = [] } = getCreepsInRoom(mineral.room);
  if (mineral.mineralAmount > 0 && mineralHarvester.length < 1) {
    const spawn = getSpawnsOrderdByRange(extractor, 1).first();
    if (!spawn) {
      console.log(`source ${extractor.id} can't find spawn`);
      return ERR_NOT_FOUND;
    }
    if (spawn.room.energyAvailable > 200) {
      const name = `Mh_${extractor.room.name}_${Game.time}`;
      const bodies = filterBodiesByCost("mineralHarvester", spawn.room.energyAvailable).bodies;
      const spawned = spawn.spawnCreep(bodies, name, {
        memory: {
          role: "mineralHarvester",
          baseRoom: extractor.room.name,
          targetId: mineral.id
        }
      });
      if (spawned !== OK) {
        console.log(`MineralHarvester spawn is ${RETURN_CODE_DECODER[spawned]} : ${JSON.stringify(bodies)}`);
      }
      return spawned;
    }
  }
  return OK;
}
function isE(s) {
  return s.structureType === STRUCTURE_EXTRACTOR;
}

// structure.factory.ts
var THRESHOLD = FACTORY_CAPACITY / RESOURCES_ALL.length;
function behaviors2(factory) {
  logUsage(`factory:${factory.room.name}`, () => {
    if (!isFactory(factory)) {
      return console.log(`${factory.id} is not factory`);
    }
    const memory = (Memory.factories = Memory.factories || {})[factory.id] = Memory.factories[factory.id] || {};
    if (memory.lastProduced) {
      factory.room.visual.text(memory.lastProduced, factory.pos.x, factory.pos.y, {
        color: "white",
        font: 0.25
      });
    }
    if (factory.cooldown) {
      return;
    }
    const commodity = _(ObjectEntries(COMMODITIES)).filter(([type, commodity2]) => {
      return !INGREDIENTS.includes(type) && (commodity2.level || 0) <= (factory.level || 0) && factory.store[type] <= THRESHOLD && ObjectEntries(commodity2.components).every(([resource, amount]) => factory.store[resource] >= amount);
    }).sortBy(([_type, commodity2]) => {
      return -(commodity2.level || 0) * FACTORY_CAPACITY;
    }).first();
    if (commodity) {
      factory.produce(commodity[0]);
      memory.lastProduced = commodity[0];
    }
  });
}
function isFactory(s) {
  return s.structureType === STRUCTURE_FACTORY;
}
var INGREDIENTS = [
  RESOURCE_ENERGY,
  RESOURCE_POWER,
  RESOURCE_METAL,
  RESOURCE_BIOMASS,
  RESOURCE_SILICON,
  RESOURCE_MIST,
  RESOURCE_OPS,
  RESOURCE_OXYGEN,
  RESOURCE_HYDROGEN,
  RESOURCE_ZYNTHIUM,
  RESOURCE_LEMERGIUM,
  RESOURCE_UTRIUM,
  RESOURCE_KEANIUM,
  RESOURCE_CATALYST,
  RESOURCE_GHODIUM
];

// structure.terminal.ts
function behaviors3(terminal) {
  logUsage(`terminal:${terminal.room.name}`, () => {
    if (!isTerminal(terminal)) {
      return console.log(`${terminal.id} is not terminal`);
    }
    if (terminal.cooldown > 0) {
      return OK;
    }
    const memory = (Memory.terminals = Memory.terminals || {})[terminal.id] = Memory.terminals[terminal.id] || {};
    if (memory.lastTrade) {
      terminal.room.visual.text(memory.lastTrade, terminal.pos.x, terminal.pos.y, { font: 0.25, color: "#ffff00" });
    }
    const terminals = getTerminals();
    if (terminals.length < 2) {
      return OK;
    }
    for (const resourceType of RESOURCES_ALL.filter((r) => {
      var _a;
      if ((((_a = terminal.room.controller) == null ? void 0 : _a.level) || 0) === 8) {
        return true;
      } else {
        return r !== RESOURCE_ENERGY;
      }
    })) {
      if (terminal.store[resourceType] > _.floor(TRANSFER_THRESHOLD * 2, -2)) {
        const transferTarget = terminals.find((t) => t.store[resourceType] < TRANSFER_THRESHOLD);
        if (transferTarget) {
          console.log(`terminal.send(${resourceType}, ${TRANSFER_THRESHOLD}, ${transferTarget.room.name})`);
          const result = terminal.send(resourceType, TRANSFER_THRESHOLD, transferTarget.room.name);
          if (result === OK) {
            return;
          } else {
            console.log(RETURN_CODE_DECODER[result]);
          }
        }
      }
    }
    if (Game.cpu.bucket < 500) {
      return OK;
    }
  });
}
function isTerminal(s) {
  return s.structureType === STRUCTURE_TERMINAL;
}

// structure.tower.ts
function behaviors4(tower) {
  if (!isTower(tower)) {
    return console.log(`${tower.id} is not tower`);
  }
  const target = _(tower.pos.findInRange(FIND_HOSTILE_CREEPS, 5)).sort((c) => c.getActiveBodyparts(HEAL)).reverse().first();
  if (target) {
    tower.attack(target);
  }
  const decayStructures = _(
    tower.room.find(FIND_STRUCTURES, {
      filter: (s) => {
        if (s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL) {
          return s.hits < RAMPART_DECAY_AMOUNT * 10;
        } else if (s.structureType === STRUCTURE_ROAD) {
          if (tower.room.memory.roadMap[s.pos.y * 50 + s.pos.x] < 0) {
            return false;
          }
          switch (_.first(s.pos.lookFor(LOOK_TERRAIN))) {
            case "plain":
              return s.hits < ROAD_DECAY_AMOUNT * 10;
            case "swamp":
              return s.hits < ROAD_DECAY_AMOUNT_SWAMP * 10;
            case "wall":
              return s.hits < ROAD_DECAY_AMOUNT_WALL * 10;
            default:
              return false;
          }
        } else if (s.structureType === STRUCTURE_CONTAINER) {
          return s.hits < CONTAINER_DECAY * 10;
        } else {
          return false;
        }
      }
    })
  );
  if (decayStructures.size() > 0) {
    return tower.repair(
      decayStructures.min((s) => {
        return s.hits * ROAD_DECAY_TIME + ("ticksToDecay" in s ? s.ticksToDecay : ROAD_DECAY_TIME);
      })
    );
  }
  _(tower.room.find(FIND_MY_CREEPS, { filter: (s) => s.hits < s.hitsMax })).tap((damaged) => {
    const minHit = _(damaged).map((s) => s.hits).min();
    const minHits = _(damaged).filter((s) => s.hits === minHit).run() || [];
    const target2 = tower.pos.findClosestByRange(minHits);
    if (target2) {
      tower.heal(target2);
    }
  }).run();
}
function isTower(s) {
  return s.structureType === STRUCTURE_TOWER;
}

// structures.ts
var structures = {
  controller: structure_controller_default,
  extractor: behavior16,
  factory: behaviors2,
  terminal: behaviors3,
  tower: behaviors4
};
var structures_default = structures;

// main.ts
module.exports.loop = function() {
  console.log(`start ${Game.time}`);
  if (Game.cpu.bucket === void 0 || Game.cpu.bucket > 200) {
    Memory.do = true;
  } else if (Game.cpu.bucket < 100) {
    Memory.do = false;
  }
  if (!Memory.do) {
    console.log(`end bucket\u4E0D\u8DB3(${Game.cpu.bucket}) usage : ${Game.cpu.getUsed()}`);
    return;
  }
  logUsage("all", () => {
    if (Game.cpu.bucket === 1e4) {
      Game.cpu.generatePixel();
    }
    if (Game.cpu.bucket < 100) {
      console.log(`bucket\u4E0D\u8DB3 :(${Game.cpu.bucket})`);
      return;
    }
    logUsage("flags", () => {
      Object.values(Game.flags).forEach((flag) => {
        var _a, _b;
        return (_b = (_a = flags_default)[flag.color]) == null ? void 0 : _b.call(_a, flag);
      });
    });
    const creeps = Object.values(Game.creeps).reduce(
      (mapping, creep) => {
        mapping[creep.memory.baseRoom] = (mapping[creep.memory.baseRoom] || []).concat(creep);
        return mapping;
      },
      {}
    );
    Object.values(Game.rooms).filter((room) => {
      var _a;
      return !isHighway(room) && ((_a = room.controller) == null ? void 0 : _a.my);
    }).forEach((room) => {
      logUsage(room.name, () => {
        var _a;
        logUsage("roomBehavior", () => roomBehavior(room));
        logUsage("structures", () => findMyStructures(room).all.forEach((s) => {
          var _a2, _b;
          return (_b = (_a2 = structures_default)[s.structureType]) == null ? void 0 : _b.call(_a2, s);
        }));
        logUsage(`creep(${(_a = creeps[room.name]) == null ? void 0 : _a.length})`, () => {
          var _a2;
          (_a2 = creeps[room.name]) == null ? void 0 : _a2.map((c) => {
            return logUsage(
              c.name,
              () => {
                var _a3, _b;
                if (c.spawning) {
                  return;
                }
                c.memory.moved = void 0;
                c.room.visual.text(c.name.split("_")[0], c.pos.x, c.pos.y, {
                  color: toColor(c)
                });
                (_b = (_a3 = behaviors)[c.memory.role]) == null ? void 0 : _b.call(_a3, c);
                if (c.getActiveBodyparts(WORK)) {
                  c.pos.lookFor(LOOK_STRUCTURES).filter((s) => [STRUCTURE_CONTAINER, STRUCTURE_ROAD].includes(s.structureType) && s.hits < s.hitsMax).forEach((s) => c.repair(s));
                }
                if (c.memory.moved === OK) {
                  if (c.room.memory.roadMap) {
                    c.room.memory.roadMap[c.pos.y * 50 + c.pos.x]++;
                  }
                  c.memory.__avoidCreep = false;
                }
              },
              0.5
            );
          });
        });
      });
    });
  });
  logUsage("delete", () => {
    Object.keys(Memory.creeps).forEach((name) => {
      if (!Game.creeps[name]) {
        delete Memory.creeps[name];
        console.log("Clearing non-existing creep memory:", name);
      }
    });
    Object.keys(Memory.rooms).forEach((name) => {
      var _a, _b;
      if (!((_b = (_a = Game.rooms[name]) == null ? void 0 : _a.controller) == null ? void 0 : _b.my)) {
        delete Memory.rooms[name];
      }
    });
    Object.values(Memory.rooms).forEach((mem) => {
      delete mem.find;
    });
    ObjectKeys(Memory.factories).forEach((id) => {
      if (!Game.getObjectById(id)) {
        delete Memory.factories[id];
      }
    });
    ObjectKeys(Memory.terminals).forEach((id) => {
      if (!Game.getObjectById(id)) {
        delete Memory.terminals[id];
      }
    });
  });
  console.log(`end ${Game.time} usage : ${Game.cpu.getUsed()}`);
};
