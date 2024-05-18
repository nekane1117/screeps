"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomBehavior = void 0;
const room_source_1 = require("./room.source");
const util_creep_1 = require("./util.creep");
const structure_links_1 = __importDefault(require("./structure.links"));
const utils_1 = require("./utils");
function roomBehavior(room) {
    var _a, _b, _c;
    if (room.find(FIND_HOSTILE_CREEPS).length && !((_a = room.controller) === null || _a === void 0 ? void 0 : _a.safeMode) && room.energyAvailable > SAFE_MODE_COST) {
        (_b = room.controller) === null || _b === void 0 ? void 0 : _b.activateSafeMode();
    }
    initMemory(room);
    room.find(FIND_SOURCES).map((source) => (0, room_source_1.behavior)(source));
    if (!room.memory.roadLayed || Math.abs(Game.time - room.memory.roadLayed) > 5000) {
        console.log("roadLayer in " + Game.time);
        roadLayer(room);
    }
    creteStructures(room);
    const { carrier: carriers, harvester } = (0, util_creep_1.getCreepsInRoom)(room).reduce((creeps, c) => {
        creeps[c.memory.role] = ((creeps === null || creeps === void 0 ? void 0 : creeps[c.memory.role]) || []).concat(c);
        return creeps;
    }, { builder: [], claimer: [], carrier: [], harvester: [], repairer: [], upgrader: [] });
    const { link } = (0, utils_1.findMyStructures)(room);
    (0, structure_links_1.default)(link);
    const { bodies, cost } = (0, util_creep_1.filterBodiesByCost)("carrier", room.energyAvailable);
    if (harvester.length &&
        carriers.filter((g) => {
            return bodies.length * CREEP_SPAWN_TIME < (g.ticksToLive || 0);
        }).length < 2) {
        const name = `G_${room.name}_${Game.time}`;
        const spawn = (0, util_creep_1.getMainSpawn)(room);
        if (spawn && !spawn.spawning && room.energyAvailable > 200) {
            if (spawn.spawnCreep(bodies, name, {
                memory: {
                    mode: "🛒",
                    role: "carrier",
                },
            }) === OK) {
                (_c = room.memory.energySummary) === null || _c === void 0 ? void 0 : _c.push({
                    time: new Date().valueOf(),
                    consumes: cost,
                    production: 0,
                });
            }
            return OK;
        }
    }
}
exports.roomBehavior = roomBehavior;
function creteStructures(room) {
    var _a, _b;
    const { visual } = room;
    const spawn = Object.values(Game.spawns).find((s) => s.room.name === room.name);
    if (!spawn) {
        return;
    }
    const siteInRooms = Object.values(Game.constructionSites)
        .filter((s) => { var _a; return ((_a = s.room) === null || _a === void 0 ? void 0 : _a.name) === room.name; })
        .reduce((sites, s) => {
        sites.all.push(s);
        (sites[s.structureType] = sites[s.structureType] || []).push(s);
        return sites;
    }, { all: [] });
    if (room.controller) {
        for (const target of staticStructures) {
            const targets = (0, utils_1.findMyStructures)(room)[target];
            if (CONTROLLER_STRUCTURES[target][room.controller.level] > 0 &&
                spawn.pos.findInRange(targets, 1).length === 0 &&
                (((_a = siteInRooms[target]) === null || _a === void 0 ? void 0 : _a.length) || 0) === 0) {
                for (const [dx, dy] of fourNeighbors) {
                    const pos = room.getPositionAt(spawn.pos.x + dx, spawn.pos.y + dy);
                    console.log("search replace position", pos);
                    if (((_b = pos === null || pos === void 0 ? void 0 : pos.lookFor(LOOK_STRUCTURES).find((s) => s.structureType === STRUCTURE_EXTENSION)) === null || _b === void 0 ? void 0 : _b.destroy()) === OK) {
                        return;
                    }
                    else if ((pos === null || pos === void 0 ? void 0 : pos.createConstructionSite(target)) === OK) {
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
                            if (Math.abs(dx) + Math.abs(dy) === dist &&
                                terrain.get(spawn.pos.x + dx, spawn.pos.y + dy) !== TERRAIN_MASK_WALL &&
                                room.createConstructionSite(spawn.pos.x + dx, spawn.pos.y + dy, generateCross(dx, dy) ? target : STRUCTURE_ROAD) === OK) {
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
    room.memory.energySummary = (room.memory.energySummary || [])
        .concat(room.getEventLog().reduce((summary, event) => {
        switch (event.event) {
            case EVENT_HARVEST:
                summary.production += event.data.amount;
                break;
            case EVENT_BUILD:
                summary.consumes += event.data.amount;
                break;
            case EVENT_REPAIR:
            case EVENT_UPGRADE_CONTROLLER:
                summary.consumes += event.data.energySpent;
                break;
            default:
                break;
        }
        return summary;
    }, {
        time: new Date().valueOf(),
        production: 0,
        consumes: 0,
    }))
        .filter((s) => {
        return s.time && s.time >= new Date().valueOf() - 1 * 60 * 60 * 1000;
    });
    const total = room.memory.energySummary.reduce((sum, current) => {
        sum.consumes += current.consumes || 0;
        sum.production += current.production || 0;
        return sum;
    }, {
        production: 0,
        consumes: 0,
    });
    const total1min = room.memory.energySummary
        .filter((s) => {
        return s.time && s.time >= new Date().valueOf() - 1 * 60 * 1000;
    })
        .reduce((sum, current) => {
        sum.consumes += current.consumes || 0;
        sum.production += current.production || 0;
        return sum;
    }, {
        production: 0,
        consumes: 0,
    });
    visual.text(`生産量：${_.floor(total.production / (1 * 60 * 60), 2)}(${_.floor(total1min.production / 60, 2)})`, 25, 25, {
        align: "left",
    });
    visual.text(`消費量：${_.floor(total.consumes / (1 * 60 * 60), 2)}(${_.floor(total1min.consumes / 60, 2)})`, 25, 26, {
        align: "left",
    });
}
const generateCross = (dx, dy) => {
    if (dx % 2 === 0) {
        return !((dy + (dx % 4 === 0 ? -2 : 0)) % 4 === 0);
    }
    else {
        return dy % 2 === 0;
    }
};
function roadLayer(room) {
    _(Object.values(Game.spawns).filter((s) => s.room.name === room.name))
        .forEach((spawn) => {
        const findCustomPath = (s) => spawn.pos.findPathTo(s, {
            ignoreCreeps: true,
            plainCost: 0.5,
            swampCost: 0.5,
        });
        return (_([
            ...room.find(FIND_SOURCES),
            ...room.find(FIND_MY_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_CONTROLLER,
            }),
        ])
            .sortBy((s) => findCustomPath(s).length)
            .map((s) => {
            return findCustomPath(s).map((path) => {
                if (room.getTerrain().get(path.x, path.y) !== TERRAIN_MASK_WALL) {
                    room.createConstructionSite(path.x, path.y, STRUCTURE_ROAD);
                }
            });
        })
            .run());
    })
        .run();
    room.memory.roadLayed = Game.time;
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
const fourNeighbors = [
    [0, -1],
    [-1, 0],
    [1, 0],
    [0, 1],
];
function initMemory(room) {
    room.memory.find = {};
    room.memory.find[FIND_STRUCTURES] = undefined;
}
const staticStructures = [STRUCTURE_STORAGE, STRUCTURE_LINK];
