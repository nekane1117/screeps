"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomBehavior = void 0;
const room_labManager_1 = __importDefault(require("./room.labManager"));
const room_source_1 = require("./room.source");
const structure_links_1 = __importDefault(require("./structure.links"));
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
function roomBehavior(room) {
    var _a, _b, _c;
    if (room.find(FIND_HOSTILE_CREEPS).length && !((_a = room.controller) === null || _a === void 0 ? void 0 : _a.safeMode) && room.energyAvailable > SAFE_MODE_COST) {
        (_b = room.controller) === null || _b === void 0 ? void 0 : _b.activateSafeMode();
    }
    const sources = room.find(FIND_SOURCES);
    sources.forEach((source) => (0, room_source_1.behavior)(source));
    const { tower, lab, link } = (0, utils_1.findMyStructures)(room);
    const mineral = _(room.find(FIND_MINERALS)).first();
    if (mineral) {
        (0, room_labManager_1.default)(lab, mineral);
    }
    if ((tower.length > 0 && !room.memory.roadLayed) || Math.abs(Game.time - room.memory.roadLayed) > 5000) {
        console.log("roadLayer in " + Game.time);
        roadLayer(room);
    }
    if (Game.time % 100 === 0) {
        creteStructures(room);
    }
    (0, structure_links_1.default)((0, utils_1.findMyStructures)(room).link);
    const { carrier: carriers = [], harvester = [], repairer = [], } = Object.values(Game.creeps)
        .filter((c) => c.memory.baseRoom === room.name)
        .reduce((creeps, c) => {
        creeps[c.memory.role] = ((creeps === null || creeps === void 0 ? void 0 : creeps[c.memory.role]) || []).concat(c);
        return creeps;
    }, {});
    const { bodies: carrierBodies } = (0, util_creep_1.filterBodiesByCost)("carrier", room.energyAvailable);
    if (harvester.length === 0) {
        return ERR_NOT_FOUND;
    }
    if (carriers.filter((g) => {
        return carrierBodies.length * CREEP_SPAWN_TIME < (g.ticksToLive || 0);
    }).length < (link.length >= sources.length + 1 ? 1 : 2)) {
        const name = `C_${room.name}_${Game.time}`;
        const spawn = (0, util_creep_1.getMainSpawn)(room);
        if (spawn && !spawn.spawning && room.energyAvailable > 200) {
            spawn.spawnCreep(carrierBodies, name, {
                memory: {
                    mode: "🛒",
                    baseRoom: spawn.room.name,
                    role: "carrier",
                },
            });
            return OK;
        }
    }
    if (room.find(FIND_HOSTILE_CREEPS).length > 0 && room.energyAvailable >= 240) {
        const { bodies: defenderBodies, cost } = (0, util_creep_1.filterBodiesByCost)("defender", room.energyAvailable);
        const spawn = room.controller &&
            ((_c = (0, utils_1.getSpawnsWithDistance)(room.controller)
                .filter((s) => !s.spawn.spawning && s.spawn.room.energyAvailable >= cost)
                .sort((a, b) => {
                const evaluation = (v) => {
                    return v.spawn.room.energyAvailable / ((v.distance + 1) ^ 2);
                };
                return evaluation(b) - evaluation(a);
            })
                .first()) === null || _c === void 0 ? void 0 : _c.spawn);
        if (spawn) {
            return spawn.spawnCreep(defenderBodies, `D_${room.name}_${Game.time}`, {
                memory: {
                    baseRoom: room.name,
                    role: "defender",
                },
            });
        }
        else {
            console.log("can't find spawn for defender");
        }
    }
    const { bodies: repairerBodies } = (0, util_creep_1.filterBodiesByCost)("repairer", Math.max(room.energyAvailable, 300));
    if ((0, util_creep_1.getRepairTarget)(room.name).length > 0 &&
        repairer.filter((g) => {
            return repairerBodies.length * CREEP_SPAWN_TIME < (g.ticksToLive || 0);
        }).length < 1) {
        const name = `R_${room.name}_${Game.time}`;
        const spawn = (0, util_creep_1.getMainSpawn)(room);
        if (spawn && !spawn.spawning && room.energyAvailable >= 300) {
            spawn.spawnCreep(repairerBodies, name, {
                memory: {
                    mode: "🛒",
                    baseRoom: spawn.room.name,
                    role: "repairer",
                },
            });
            return OK;
        }
    }
}
exports.roomBehavior = roomBehavior;
function creteStructures(room) {
    var _a, _b;
    const spawn = (0, util_creep_1.getMainSpawn)(room);
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
        if (CONTROLLER_STRUCTURES[STRUCTURE_EXTRACTOR][room.controller.level] && !siteInRooms.extractor && (0, utils_1.findMyStructures)(room).extractor.length === 0) {
            const mineral = _(room.find(FIND_MINERALS)).first();
            if (mineral) {
                mineral.pos.createConstructionSite(STRUCTURE_EXTRACTOR);
            }
            return;
        }
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
        const targets = [STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_SPAWN, STRUCTURE_STORAGE, STRUCTURE_LAB];
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
                filter: (s) => {
                    return s.structureType === STRUCTURE_CONTROLLER || s.structureType === STRUCTURE_EXTRACTOR || s.structureType === STRUCTURE_TOWER;
                },
            }),
        ])
            .sortBy((s) => findCustomPath(s).length)
            .map((s) => {
            return findCustomPath(s).map((path) => {
                var _a;
                const pos = room.getPositionAt(path.x, path.y);
                if (pos &&
                    ((_a = pos.lookFor(LOOK_TERRAIN)) === null || _a === void 0 ? void 0 : _a[0]) !== "wall" &&
                    !pos.lookFor(LOOK_STRUCTURES).find((s) => OBSTACLE_OBJECT_TYPES.includes(s.structureType))) {
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
const staticStructures = [STRUCTURE_STORAGE, STRUCTURE_LINK, STRUCTURE_TERMINAL];
