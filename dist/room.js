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
            reserver: 100,
            upgrader: 100,
        };
    }
    const { builder = [], carrier: carriers = [], harvester = [], remoteCarrier = [], remoteHarvester = [], reserver = [] } = (0, util_creep_1.getCreepsInRoom)(room);
    updateRoadMap(room);
    const { lab, link, source, } = (0, utils_1.findMyStructures)(room);
    source.forEach((s) => (0, room_source_1.behavior)(s));
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
    if (carriers.filter((g) => {
        return carrierBodies.length * CREEP_SPAWN_TIME < (g.ticksToLive || Infinity);
    }).length < (link.length >= source.length + 1 ? 1 : 2)) {
        const name = `C_${room.name}_${Game.time}`;
        const spawn = _((0, utils_1.getSpawnsInRoom)(room))
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
    if (room.energyAvailable >= room.energyCapacityAvailable * 0.9 &&
        (((_c = (0, util_creep_1.getCreepsInRoom)(room).defender) === null || _c === void 0 ? void 0 : _c.length) || 0) === 0 &&
        room.find(FIND_HOSTILE_CREEPS).length > 0) {
        const spawn = _((0, utils_1.getSpawnsInRoom)(room))
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
        return builderBodies.length * CREEP_SPAWN_TIME < (g.ticksToLive || Infinity);
    }).length < 1 &&
        (room.find(FIND_STRUCTURES, { filter: (s) => s.hits < s.hitsMax }).length > 0 ||
            (0, utils_1.getSitesInRoom)(room).length > 0)) {
        const spawn = (() => {
            const spawns = (0, utils_1.getSpawnsInRoom)(room);
            if (spawns.length > 0) {
                return spawns.find((s) => !s.spawning && s.room.energyAvailable === s.room.energyCapacityAvailable);
            }
            else {
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
        const filterThisRemote = (c) => { var _a; return ((_a = c === null || c === void 0 ? void 0 : c.memory) === null || _a === void 0 ? void 0 : _a.targetRoomName) === targetRoomName; };
        const { roomRemoteCarrier, roomRemoteHarvester, roomReserver } = {
            roomReserver: reserver.filter(filterThisRemote),
            roomRemoteCarrier: remoteCarrier.filter(filterThisRemote),
            roomRemoteHarvester: remoteHarvester.filter(filterThisRemote),
        };
        if (roomReserver.length === 0) {
            const spawn = (_a = (0, utils_1.getSpawnsInRoom)(room)) === null || _a === void 0 ? void 0 : _a.find((s) => !s.spawning);
            if (spawn) {
                const spawned = spawn.spawnCreep((0, util_creep_1.filterBodiesByCost)("reserver", room.energyAvailable).bodies, `V_${room.name}_${targetRoomName}_${Game.time}`, {
                    memory: {
                        baseRoom: room.name,
                        role: "reserver",
                        targetRoomName,
                    },
                });
                if (spawned !== OK) {
                    console.log("crete reserver", util_creep_1.RETURN_CODE_DECODER[spawned.toString()]);
                }
            }
        }
        const { bodies } = (0, util_creep_1.filterBodiesByCost)("remoteHarvester", room.energyAvailable);
        if (roomRemoteHarvester.length < 1) {
            const spawn = (_b = (0, utils_1.getSpawnsInRoom)(room)) === null || _b === void 0 ? void 0 : _b.find((s) => !s.spawning);
            if (spawn) {
                const spawned = spawn.spawnCreep(bodies, `Rh_${room.name}_${targetRoomName}_${Game.time}`, {
                    memory: {
                        baseRoom: room.name,
                        role: "remoteHarvester",
                        targetRoomName,
                    },
                });
                if (spawned !== OK) {
                    console.log("create remotehaervester", util_creep_1.RETURN_CODE_DECODER[spawned.toString()]);
                }
            }
        }
        _((0, util_creep_1.getCarrierBody)(room, "remoteCarrier"))
            .tap((body) => {
            var _a;
            if (roomRemoteHarvester.length > 0 && roomRemoteCarrier.length < 1) {
                const spawn = (_a = (0, utils_1.getSpawnsInRoom)(room)) === null || _a === void 0 ? void 0 : _a.find((s) => !s.spawning);
                if (spawn) {
                    const spawned = spawn.spawnCreep(body, `Rc_${room.name}_${targetRoomName}_${Game.time}`, {
                        memory: {
                            baseRoom: room.name,
                            role: "remoteCarrier",
                            targetRoomName,
                            mode: "🛒",
                        },
                    });
                    if (spawned !== OK) {
                        console.log("create remotehaervester", util_creep_1.RETURN_CODE_DECODER[spawned.toString()]);
                    }
                }
            }
        })
            .run();
    });
}
exports.roomBehavior = roomBehavior;
function creteStructures(room) {
    var _a, _b;
    const mainSpawn = (0, util_creep_1.getMainSpawn)(room);
    if (!mainSpawn) {
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
        console.log(staticStructures.filter((s) => (0, utils_1.findMyStructures)(room)[s].length === 0));
        for (const target of staticStructures.filter((s) => (0, utils_1.findMyStructures)(room)[s].length === 0)) {
            const targets = (0, utils_1.findMyStructures)(room)[target];
            if (CONTROLLER_STRUCTURES[target][room.controller.level] > 0 &&
                mainSpawn.pos.findInRange(targets, 1).length === 0 &&
                (((_a = siteInRooms[target]) === null || _a === void 0 ? void 0 : _a.length) || 0) === 0) {
                for (const [dx, dy] of fourNeighbors) {
                    const pos = room.getPositionAt(mainSpawn.pos.x + dx, mainSpawn.pos.y + dy);
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
                            const pos = new RoomPosition(mainSpawn.pos.x + dx, mainSpawn.pos.y + dy, room.name);
                            if (Math.abs(dx) + Math.abs(dy) === dist &&
                                pos &&
                                terrain.get(mainSpawn.pos.x + dx, mainSpawn.pos.y + dy) !== TERRAIN_MASK_WALL &&
                                generateCross(dx, dy)) {
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
function updateRoadMap(room) {
    const { road: roads, spawn } = (0, utils_1.findMyStructures)(room);
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
        if (Game.time % 600 === 0) {
            const pos = room.getPositionAt(x, y);
            if (pos) {
                const road = _([pos === null || pos === void 0 ? void 0 : pos.lookFor(LOOK_STRUCTURES), pos === null || pos === void 0 ? void 0 : pos.lookFor(LOOK_CONSTRUCTION_SITES)])
                    .flatten()
                    .compact()
                    .find((s) => s.structureType === STRUCTURE_ROAD);
                if (road && value < 0) {
                    "remove" in road ? road.remove() : road.destroy();
                }
                else if (!road && Math.ceil(value) >= 10 && pos.findInRange([...roads, ...spawn, ...room.find(FIND_MY_STRUCTURES)], 3).length > 0) {
                    pos.createConstructionSite(STRUCTURE_ROAD);
                }
            }
        }
        return value;
    });
}
