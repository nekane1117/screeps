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
    const { carrier: carriers = [], harvester = [], remoteCarrier = [], remoteHarvester = [], reserver = [] } = (0, util_creep_1.getCreepsInRoom)(room);
    if (room.storage) {
        room.visual.text(room.storage.store.energy.toString(), room.storage.pos.x, room.storage.pos.y, {
            font: 0.25,
        });
    }
    (_c = room.memory.remote) === null || _c === void 0 ? void 0 : _c.forEach((targetRoomName) => {
        var _a, _b;
        if (room.energyAvailable < Math.max(600, room.energyCapacityAvailable)) {
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
                        mode: "🌾",
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
    updateRoadMap(room);
    const { lab, source } = (0, utils_1.findMyStructures)(room);
    source.forEach((s) => (0, room_source_1.behavior)(s));
    const mineral = _(room.find(FIND_MINERALS)).first();
    if (mineral) {
        (0, room_labManager_1.default)(lab, mineral);
    }
    if (room.name === "sim" || Game.time % 100 === 0) {
        createStructures(room);
    }
    (0, structure_links_1.default)((0, utils_1.findMyStructures)(room).link);
    const carrierBodies = (0, util_creep_1.getCarrierBody)(room, "carrier");
    if (harvester.length === 0) {
        return ERR_NOT_FOUND;
    }
    if (carriers.filter((g) => {
        return carrierBodies.length * CREEP_SPAWN_TIME < (g.ticksToLive || Infinity);
    }).length < 1) {
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
        (((_d = (0, util_creep_1.getCreepsInRoom)(room).defender) === null || _d === void 0 ? void 0 : _d.length) || 0) === 0 &&
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
    if (checkSpawnBuilder(room)) {
        const spawn = (() => {
            var _a;
            const spawns = (0, utils_1.getSpawnsInRoom)(room);
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
}
exports.roomBehavior = roomBehavior;
function createStructures(room) {
    const mainSpawn = (0, util_creep_1.getMainSpawn)(room);
    if (!mainSpawn) {
        return;
    }
    const { extractor } = (0, utils_1.findMyStructures)(room);
    const { extractor: extractorSite = [] } = _((0, utils_1.getSitesInRoom)(room))
        .groupBy((s) => s.structureType)
        .value();
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
    for (const structureType of [STRUCTURE_OBSERVER, STRUCTURE_TOWER, STRUCTURE_EXTENSION]) {
        const structures = _([(0, utils_1.findMyStructures)(room)[structureType]])
            .flatten()
            .value();
        const sites = (0, utils_1.getSitesInRoom)(room).filter((s) => s.structureType === structureType);
        if (structures.length + sites.length < CONTROLLER_STRUCTURES[structureType][room.controller.level]) {
            const isOdd = !!((mainSpawn.pos.x + mainSpawn.pos.y) % 2);
            const pos = (room.storage || mainSpawn).pos.findClosestByPath(_(2500)
                .range()
                .filter((i) => {
                const [x, y] = [i % 50, Math.floor(i / 50)];
                return (isOdd === !!((x + y) % 2) &&
                    !STATIC_STRUCTURES.find(({ dx, dy }) => {
                        return x === mainSpawn.pos.x + dx && y === mainSpawn.pos.y + dy;
                    }));
            })
                .map((i) => {
                return room.getPositionAt(i % 50, Math.floor(i / 50));
            })
                .compact()
                .value(), {
                filter: (p) => {
                    return (_(p.lookFor(LOOK_TERRAIN)).first() !== "wall" &&
                        ![...p.lookFor(LOOK_STRUCTURES), ...p.lookFor(LOOK_CONSTRUCTION_SITES)].find((s) => {
                            return s.structureType !== STRUCTURE_ROAD;
                        }));
                },
            });
            pos === null || pos === void 0 ? void 0 : pos.createConstructionSite(structureType);
        }
    }
}
function updateRoadMap(room) {
    const { road: roads, spawn, source } = (0, utils_1.findMyStructures)(room);
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
                else if (!road && Math.ceil(value) >= 10 && pos.findInRange([...source, ...roads, ...spawn, ...room.find(FIND_MY_STRUCTURES)], 3).length > 0) {
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
function checkSpawnBuilder(room) {
    const { builder = [] } = (0, util_creep_1.getCreepsInRoom)(room);
    if (room.energyAvailable < room.energyCapacityAvailable) {
        return false;
    }
    const { bodies: builderBodies } = (0, util_creep_1.filterBodiesByCost)("builder", room.energyCapacityAvailable);
    return (builder.filter((g) => {
        return builderBodies.length * CREEP_SPAWN_TIME < (g.ticksToLive || Infinity);
    }).length < 1);
}
