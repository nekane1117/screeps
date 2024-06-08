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
const util_creep_2 = require("./util.creep");
const utils_2 = require("./utils");
function roomBehavior(room) {
    var _a, _b, _c, _d;
    if (room.find(FIND_HOSTILE_CREEPS).length && !((_a = room.controller) === null || _a === void 0 ? void 0 : _a.safeMode) && room.energyAvailable > SAFE_MODE_COST) {
        (_b = room.controller) === null || _b === void 0 ? void 0 : _b.activateSafeMode();
    }
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
    const { builder = [], carrier: carriers = [], harvester = [], remoteHarvester = [], reserver = [] } = (0, util_creep_1.getCreepsInRoom)(room);
    room.memory.roadMap = room.memory.roadMap || _.range(2500).map(() => Game.time);
    const sources = room.find(FIND_SOURCES);
    sources.forEach((source) => (0, room_source_1.behavior)(source));
    const { lab, link, } = (0, utils_1.findMyStructures)(room);
    const mineral = _(room.find(FIND_MINERALS)).first();
    if (mineral) {
        (0, room_labManager_1.default)(lab, mineral);
    }
    if (Game.time % 100 === 0) {
        creteStructures(room);
    }
    (0, structure_links_1.default)((0, utils_1.findMyStructures)(room).link);
    const carrierBodies = (0, util_creep_1.getCarrierBody)(room, "carrier");
    if (harvester.length === 0) {
        return ERR_NOT_FOUND;
    }
    if (harvester.length &&
        carriers.filter((g) => {
            return carrierBodies.length * CREEP_SPAWN_TIME < (g.ticksToLive || 0);
        }).length < (link.length >= sources.length + 1 ? 1 : 2)) {
        const name = `C_${room.name}_${Game.time}`;
        const spawn = _((0, utils_2.getSpawnsInRoom)(room))
            .filter((s) => !s.spawning)
            .first();
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
    if (room.find(FIND_HOSTILE_CREEPS).length > 0 &&
        room.energyAvailable >= room.energyCapacityAvailable * 0.9 &&
        (((_c = (0, util_creep_1.getCreepsInRoom)(room).defender) === null || _c === void 0 ? void 0 : _c.length) || 0) === 0) {
        const spawn = _((0, utils_2.getSpawnsInRoom)(room))
            .filter((s) => !s.spawning)
            .first();
        if (spawn) {
            return spawn.spawnCreep((0, util_creep_1.filterBodiesByCost)("defender", room.energyAvailable).bodies, `D_${room.name}_${Game.time}`, {
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
    const { bodies: builderBodies } = (0, util_creep_1.filterBodiesByCost)("builder", room.energyCapacityAvailable);
    if (builder.filter((g) => {
        return builderBodies.length * CREEP_SPAWN_TIME < (g.ticksToLive || 0);
    }).length < 1 &&
        (room.find(FIND_STRUCTURES, { filter: (s) => s.hits < s.hitsMax }).length > 0 ||
            (0, utils_1.getSitesInRoom)(room).length > 0)) {
        const spawn = (() => {
            var _a;
            const spawns = (0, utils_2.getSpawnsInRoom)(room);
            if (spawns.length > 0) {
                return spawns.find((s) => !s.spawning && s.room.energyAvailable === s.room.energyCapacityAvailable);
            }
            else {
                return (_a = room.controller) === null || _a === void 0 ? void 0 : _a.pos.findClosestByPath(Object.values(Game.spawns));
            }
        })();
        if (spawn && spawn.room.energyAvailable === spawn.room.energyCapacityAvailable) {
            spawn.spawnCreep((0, util_creep_1.filterBodiesByCost)("builder", spawn.room.energyCapacityAvailable).bodies, `B_${room.name}_${Game.time}`, {
                memory: {
                    mode: "🛒",
                    baseRoom: spawn.room.name,
                    role: "builder",
                },
            });
        }
    }
    (_d = room.memory.remote) === null || _d === void 0 ? void 0 : _d.forEach((targetRoomName) => {
        var _a, _b;
        if (room.energyAvailable < room.energyCapacityAvailable) {
            return;
        }
        if (!reserver.find((c) => c.memory.targetRoomName === targetRoomName)) {
            const spawn = (_a = (0, utils_2.getSpawnsInRoom)(room)) === null || _a === void 0 ? void 0 : _a.find((s) => !s.spawning);
            if (spawn) {
                const spawned = spawn.spawnCreep((0, util_creep_1.filterBodiesByCost)("reserver", room.energyAvailable).bodies, `V_${room.name}_${targetRoomName}`, {
                    memory: {
                        baseRoom: room.name,
                        role: "reserver",
                        targetRoomName,
                    },
                });
                if (spawned !== OK) {
                    console.log("crete reserver", util_creep_2.RETURN_CODE_DECODER[spawned.toString()]);
                }
            }
        }
        const { bodies } = (0, util_creep_1.filterBodiesByCost)("remoteHarvester", room.energyAvailable);
        if (remoteHarvester.filter((c) => c.memory.targetRoomName === targetRoomName && (c.ticksToLive || 0) > bodies.length * CREEP_SPAWN_TIME).length < 2) {
            const spawn = (_b = (0, utils_2.getSpawnsInRoom)(room)) === null || _b === void 0 ? void 0 : _b.find((s) => !s.spawning);
            if (spawn) {
                const spawned = spawn.spawnCreep(bodies, `Rh_${room.name}_${targetRoomName}_${Game.time}`, {
                    memory: {
                        baseRoom: room.name,
                        role: "remoteHarvester",
                        targetRoomName,
                        mode: "🌾",
                    },
                });
                if (spawned !== OK) {
                    console.log("create remotehaervester", util_creep_2.RETURN_CODE_DECODER[spawned.toString()]);
                }
            }
        }
    });
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
                                generateCross(dx, dy) &&
                                room.createConstructionSite(spawn.pos.x + dx, spawn.pos.y + dy, target) === OK) {
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
const fourNeighbors = [
    [0, -1],
    [-1, 0],
    [1, 0],
    [0, 1],
];
const staticStructures = [STRUCTURE_STORAGE, STRUCTURE_LINK, STRUCTURE_TERMINAL];
