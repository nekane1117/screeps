"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (creep) => {
    if (!isRemoteHarvester(creep)) {
        return console.log(`${creep.name} is not RemoteHarvester`);
    }
    const memory = (0, utils_1.readonly)(creep.memory);
    const checkMode = () => {
        const newMode = ((creep) => {
            if (creep.memory.mode === "👷" && (0, utils_1.getSitesInRoom)(creep.room).length === 0) {
                return "🚛";
            }
            else if (creep.store.energy === 0) {
                return "🌾";
            }
            else if (memory.mode === "🌾" && (0, utils_1.getCapacityRate)(creep) === 1) {
                return "🚛";
            }
            else {
                return memory.mode;
            }
        })(creep);
        if (memory.mode !== newMode) {
            creep.say(newMode);
            creep.memory.mode = newMode;
            creep.memory.route = undefined;
            creep.memory.siteId = undefined;
            creep.memory.storeId = undefined;
        }
    };
    checkMode();
    const hostiles = creep.room.find(FIND_HOSTILE_CREEPS);
    const inverderCodre = creep.room.find(FIND_HOSTILE_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_INVADER_CORE });
    const enemy = creep.pos.findClosestByRange(_.compact([...hostiles, ...inverderCodre]));
    if (enemy) {
        const defenders = (0, util_creep_1.getCreepsInRoom)(creep.room).defender || [];
        if (defenders.length === 0) {
            const baseRoom = Game.rooms[memory.baseRoom];
            if (baseRoom && baseRoom.energyAvailable === baseRoom.energyCapacityAvailable) {
                const spawn = (0, utils_1.getSpawnsInRoom)(baseRoom).find((s) => !s.spawning);
                if (spawn) {
                    spawn.spawnCreep((0, util_creep_1.filterBodiesByCost)("defender", baseRoom.energyAvailable).bodies, `D_${creep.room.name}_${Game.time}`, {
                        memory: {
                            role: "defender",
                            baseRoom: memory.targetRoomName,
                            targetId: enemy.id,
                        },
                    });
                }
            }
        }
    }
    harvest(creep);
    if ((0, utils_1.getSitesInRoom)(creep.room).length === 0) {
        if (!(0, utils_1.isHighway)(creep.room) && !creep.pos.lookFor(LOOK_STRUCTURES).find((s) => s.structureType === STRUCTURE_ROAD)) {
            creep.pos.createConstructionSite(STRUCTURE_ROAD);
        }
    }
    build(creep);
    const repariTarget = creep.pos.roomName !== memory.baseRoom && creep.pos.lookFor(LOOK_STRUCTURES).find((s) => s.hits < s.hitsMax);
    if (repariTarget) {
        creep.repair(repariTarget);
    }
    const healTarget = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
        filter: (c) => {
            return c.hits < c.hitsMax && creep.pos.inRangeTo(c, 3);
        },
    });
    if (healTarget) {
        if (creep.pos.isNearTo(healTarget)) {
            creep.heal(healTarget);
        }
        else {
            creep.rangedHeal(healTarget);
        }
    }
    (0, util_creep_1.pickUpAll)(creep);
    transfer(creep);
};
exports.default = behavior;
function isRemoteHarvester(creep) {
    return creep.memory.role === "remoteHarvester";
}
function harvest(creep) {
    var _a, _b, _c, _d;
    const memory = (0, utils_1.readonly)(creep.memory);
    const targetRoom = Game.rooms[memory.targetRoomName];
    if (targetRoom) {
        const hostiles = [...targetRoom.find(FIND_HOSTILE_CREEPS), ...targetRoom.find(FIND_HOSTILE_SPAWNS), ...targetRoom.find(FIND_HOSTILE_STRUCTURES)];
        if (hostiles.length > 0 && creep.getActiveBodyparts(ATTACK)) {
            const target = creep.pos.findClosestByPath(hostiles) || _(hostiles).first();
            if (target) {
                (0, util_creep_1.customMove)(creep, target, {
                    range: !("body" in target) || target.getActiveBodyparts(ATTACK) === 0 ? 0 : 3,
                });
                creep.rangedAttack(target);
                creep.attack(target);
            }
        }
        else {
            if (memory.harvestTargetId) {
                if (!Game.getObjectById(memory.harvestTargetId)) {
                    creep.memory.harvestTargetId = undefined;
                }
            }
            if (!memory.harvestTargetId) {
                creep.memory.harvestTargetId = (_a = _(targetRoom.find(FIND_SOURCES) || [])
                    .sort((s1, s2) => {
                    const getPriority = (s) => {
                        if (s.energy > 0) {
                            return s.pos.getRangeTo(creep);
                        }
                        else {
                            return SOURCE_ENERGY_CAPACITY + s.ticksToRegeneration;
                        }
                    };
                    return getPriority(s1) - getPriority(s2);
                })
                    .first()) === null || _a === void 0 ? void 0 : _a.id;
            }
            const source = memory.harvestTargetId && Game.getObjectById(memory.harvestTargetId);
            if (!source || source.pos.roomName !== memory.targetRoomName) {
                creep.memory.harvestTargetId = undefined;
                return ERR_NOT_FOUND;
            }
            switch ((creep.memory.worked = creep.harvest(source))) {
                case OK:
                    _(creep.pos.findInRange(FIND_MY_CREEPS, 1, {
                        filter: (c) => {
                            return c.memory.role === "remoteHarvester" && (c.pos.x < creep.pos.x || c.pos.y < creep.pos.y);
                        },
                    }))
                        .tap((neighbors) => {
                        const c = _(neighbors).first();
                        if (c) {
                            creep.transfer(c, RESOURCE_ENERGY);
                        }
                    })
                        .run();
                    return OK;
                case ERR_NOT_IN_RANGE:
                    if (memory.mode === "🌾") {
                        if (creep.room.name !== creep.memory.baseRoom) {
                            const moveing = _(((_b = memory._move) === null || _b === void 0 ? void 0 : _b.path) || []).first();
                            const isInRange = (n) => {
                                return 0 < n && n < 49;
                            };
                            const blocker = moveing &&
                                isInRange(creep.pos.x + moveing.dx) &&
                                isInRange(creep.pos.y + moveing.dy) &&
                                creep.room
                                    .lookForAt(LOOK_STRUCTURES, creep.pos.x + moveing.dx, creep.pos.y + moveing.dy)
                                    .find((s) => OBSTACLE_OBJECT_TYPES.includes(s.structureType));
                            if (blocker) {
                                creep.dismantle(blocker);
                            }
                        }
                        return (0, util_creep_1.customMove)(creep, source, {
                            ignoreCreeps: !creep.pos.inRangeTo(source, 2),
                            ignoreDestructibleStructures: !((_d = (_c = creep.room.controller) === null || _c === void 0 ? void 0 : _c.owner) === null || _d === void 0 ? void 0 : _d.username),
                        });
                    }
                    else {
                        return memory.worked;
                    }
                default:
                    creep.memory.harvestTargetId = undefined;
                    return;
            }
        }
    }
    else {
        if (memory.mode === "🌾") {
            return moveRoom(creep, creep.pos.roomName, memory.targetRoomName);
        }
        else {
            return OK;
        }
    }
}
function build(creep) {
    var _a, _b, _c;
    const memory = (0, utils_1.readonly)(creep.memory);
    const sitesInroom = (0, utils_1.getSitesInRoom)(creep.pos.roomName);
    if (memory.mode === "🚛" && sitesInroom.length > 0) {
        creep.memory.mode = "👷";
        creep.memory.siteId = undefined;
        creep.say(creep.memory.mode);
    }
    if (!memory.siteId) {
        creep.memory.siteId = (_a = creep.pos.findClosestByPath(sitesInroom, { maxRooms: 0 })) === null || _a === void 0 ? void 0 : _a.id;
    }
    const site = memory.siteId && Game.getObjectById(memory.siteId);
    if (!site) {
        creep.memory.siteId = undefined;
        return ERR_NOT_FOUND;
    }
    if (memory.mode === "👷" && creep.pos.getRangeTo(site) > 0) {
        (0, util_creep_1.customMove)(creep, site, {
            ignoreCreeps: !creep.pos.inRangeTo(site, 6),
            ignoreDestructibleStructures: !((_c = (_b = creep.room.controller) === null || _b === void 0 ? void 0 : _b.owner) === null || _c === void 0 ? void 0 : _c.username),
        });
    }
    return (creep.memory.worked = creep.build(site));
}
function moveRoom(creep, fromRoom, toRoom) {
    var _a;
    const memory = (0, utils_1.readonly)(creep.memory);
    const route = memory.route ||
        (creep.memory.route = Game.map.findRoute(fromRoom, toRoom, {
            routeCallback(roomName) {
                var _a;
                const parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
                const isHighway = parsed && (Number(parsed[1]) % 10 === 0 || Number(parsed[2]) % 10 === 0);
                const isMyRoom = Game.rooms[roomName] && Game.rooms[roomName].controller && ((_a = Game.rooms[roomName].controller) === null || _a === void 0 ? void 0 : _a.my);
                if (isHighway || isMyRoom) {
                    return 1;
                }
                else {
                    return 2.5;
                }
            },
        }));
    if (!Array.isArray(route)) {
        creep.memory.route = undefined;
        return route;
    }
    const current = route[route.findIndex((r) => r.room === creep.pos.roomName) + 1];
    if (!current) {
        creep.memory.route = undefined;
        return;
    }
    if (((_a = memory.exit) === null || _a === void 0 ? void 0 : _a.roomName) !== creep.pos.roomName) {
        creep.memory.exit = creep.pos.findClosestByPath(current.exit);
    }
    const moved = creep.memory.exit && (0, util_creep_1.customMove)(creep, new RoomPosition(creep.memory.exit.x, creep.memory.exit.y, creep.memory.exit.roomName));
    if (moved !== OK) {
        const code = moved ? util_creep_1.RETURN_CODE_DECODER[moved.toString()] : "no exit";
        console.log(`${creep.name}:${code}`);
        creep.say(code.replace("ERR_", ""));
        creep.memory.route = undefined;
        creep.memory.exit = undefined;
    }
    return moved;
}
function transfer(creep) {
    var _a, _b;
    const memory = (0, utils_1.readonly)(creep.memory);
    const baseRoom = Game.rooms[memory.baseRoom];
    if (baseRoom) {
        if (memory.storeId && ((_a = Game.getObjectById(memory.storeId)) === null || _a === void 0 ? void 0 : _a.store.getFreeCapacity(RESOURCE_ENERGY)) === 0) {
            creep.memory.storeId = undefined;
        }
        const { container, spawn, extension, storage, link, terminal } = (0, utils_1.findMyStructures)(baseRoom);
        const filtedContainers = container.filter((s) => s.pos.findInRange(FIND_MINERALS, 3).length === 0);
        if (!memory.storeId) {
            creep.memory.storeId = (_b = (0, utils_1.logUsage)("search remote container", () => {
                const targets = [...filtedContainers, ...spawn, ...extension, ...storage, ...link, ...terminal].filter((s) => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                const result = PathFinder.search(creep.pos, targets.map((p) => p.pos), {
                    plainCost: 2,
                    swampCost: 2,
                });
                if (result.incomplete) {
                    return undefined;
                }
                const goal = _(result.path).last();
                return targets.find((t) => {
                    return t.pos.x === goal.x && t.pos.y === goal.y && t.pos.roomName === goal.roomName;
                });
            })) === null || _b === void 0 ? void 0 : _b.id;
        }
        const store = memory.storeId && Game.getObjectById(memory.storeId);
        if (!store || store.pos.roomName !== memory.baseRoom) {
            creep.memory.storeId = undefined;
            return ERR_NOT_FOUND;
        }
        Object.keys(creep.store).forEach((resourceType) => {
            if ((creep.memory.worked = creep.transfer(store, resourceType)) === ERR_NOT_IN_RANGE && memory.mode === "🚛") {
                return (0, util_creep_1.customMove)(creep, store, {
                    plainCost: 2,
                    swampCost: 2,
                    ignoreCreeps: !creep.pos.inRangeTo(store, 2),
                });
            }
            else {
                return creep.memory.worked;
            }
        });
    }
    else {
        if (memory.mode === "🚛") {
            return moveRoom(creep, creep.pos.roomName, memory.baseRoom);
        }
        else {
            return OK;
        }
    }
}
