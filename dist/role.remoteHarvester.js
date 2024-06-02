"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (creep) => {
    if (!isRemoteHarvester(creep)) {
        return console.log(`${creep.name} is not Builder`);
    }
    const memory = (0, utils_1.readonly)(creep.memory);
    const checkMode = () => {
        const newMode = ((creep) => {
            if (creep.store.energy === 0) {
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
            creep.memory.harvestTargetId = undefined;
            creep.memory.siteId = undefined;
            creep.memory.storeId = undefined;
        }
    };
    checkMode();
    harvest(creep);
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
    if (creep.pos.roomName === memory.targetRoomName) {
        if (!memory.harvestTargetId) {
            creep.memory.harvestTargetId = (_a = _(creep.room.find(FIND_SOURCES) || [])
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
        if (!source || source.energy === 0 || source.pos.roomName !== memory.targetRoomName) {
            creep.memory.harvestTargetId = undefined;
            return ERR_NOT_FOUND;
        }
        if ((creep.memory.worked = creep.harvest(source)) === ERR_NOT_IN_RANGE && memory.mode === "🌾") {
            const moveing = _(((_b = memory._move) === null || _b === void 0 ? void 0 : _b.path) || []).first();
            const blocker = moveing &&
                creep.room
                    .lookForAt(LOOK_STRUCTURES, creep.pos.x + moveing.dx, creep.pos.y + moveing.dy)
                    .find((s) => OBSTACLE_OBJECT_TYPES.includes(s.structureType));
            if (blocker) {
                if (creep.dismantle(blocker) !== OK) {
                    creep.attack(blocker);
                }
            }
            return (0, util_creep_1.customMove)(creep, source, {
                ignoreDestructibleStructures: !((_d = (_c = creep.room.controller) === null || _c === void 0 ? void 0 : _c.owner) === null || _d === void 0 ? void 0 : _d.username),
            });
        }
        else {
            return creep.memory.worked;
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
    if (creep.pos.roomName !== memory.baseRoom &&
        memory.harvestTargetId &&
        Object.values(Game.constructionSites).length === 0 &&
        !creep.pos.lookFor(LOOK_STRUCTURES).find((s) => s.structureType === STRUCTURE_ROAD) &&
        !creep.pos.lookFor(LOOK_CONSTRUCTION_SITES).find((s) => s.structureType === STRUCTURE_ROAD)) {
        const spawn = Game.rooms[memory.baseRoom] && (0, util_creep_1.getMainSpawn)(Game.rooms[memory.baseRoom]);
        const source = Game.getObjectById(memory.harvestTargetId);
        if (spawn && source) {
            const route = Game.map.findRoute(source.pos.roomName, spawn.pos.roomName, {
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
            });
            if (!Array.isArray(route)) {
                return console.log("no Construction route");
            }
            const allowedRoom = route.reduce((allowedRoom, { room }) => {
                allowedRoom[room] = true;
                return allowedRoom;
            }, {
                [creep.pos.roomName]: true,
                [memory.baseRoom]: true,
            });
            console.log("try construction", JSON.stringify(allowedRoom));
            PathFinder.search(source.pos, spawn.pos, {
                plainCost: 1,
                swampCost: 1,
                roomCallback(roomName) {
                    if (allowedRoom[roomName] === undefined) {
                        return false;
                    }
                    else {
                        const room = Game.rooms[roomName];
                        if (!room)
                            return false;
                        const costs = new PathFinder.CostMatrix();
                        _.range(50).forEach((x) => {
                            _.range(50).forEach((y) => {
                                var _a;
                                if (((_a = room.lookForAt(LOOK_TERRAIN, x, y)) === null || _a === void 0 ? void 0 : _a[0]) !== "wall") {
                                    costs.set(x, y, 2);
                                }
                            });
                        });
                        [...room.find(FIND_STRUCTURES), ...room.find(FIND_MY_CONSTRUCTION_SITES)].forEach((s) => {
                            if (s.structureType === STRUCTURE_ROAD) {
                                costs.set(s.pos.x, s.pos.y, 2);
                            }
                        });
                        room
                            .find(FIND_STRUCTURES, {
                            filter: (s) => {
                                return OBSTACLE_OBJECT_TYPES.includes(s.structureType);
                            },
                        })
                            .forEach(function (obstacle) {
                            costs.set(obstacle.pos.x, obstacle.pos.y, 0xff);
                        });
                        return costs;
                    }
                },
            }).path.map((p) => p.createConstructionSite(STRUCTURE_ROAD));
        }
        else {
            console.log("missing", JSON.stringify({ spawn, source }));
        }
    }
    if (memory.mode === "🚛" && creep.pos.roomName !== memory.baseRoom && sitesInroom.length > 0) {
        creep.memory.mode = "👷";
        creep.say(creep.memory.mode);
    }
    if (!memory.siteId) {
        creep.memory.siteId = (_a = creep.pos.findClosestByPath(sitesInroom)) === null || _a === void 0 ? void 0 : _a.id;
    }
    const site = memory.siteId && Game.getObjectById(memory.siteId);
    if (!site) {
        creep.memory.siteId = undefined;
        return ERR_NOT_FOUND;
    }
    if (creep.store.energy >= creep.getActiveBodyparts(WORK) * BUILD_POWER) {
        if ((creep.memory.worked = creep.build(site)) === ERR_NOT_IN_RANGE && memory.mode === "👷") {
            return (0, util_creep_1.customMove)(creep, site, {
                ignoreDestructibleStructures: !((_c = (_b = creep.room.controller) === null || _b === void 0 ? void 0 : _b.owner) === null || _c === void 0 ? void 0 : _c.username),
            });
        }
        else {
            return creep.memory.worked;
        }
    }
    else {
        creep.say("🌾");
        creep.memory.mode = "🌾";
        creep.memory.harvestTargetId = undefined;
    }
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
    if (creep.pos.roomName === memory.baseRoom) {
        const { container, spawn, extension, storage, link, terminal } = (0, utils_1.findMyStructures)(creep.room);
        if (memory.storeId && ((_a = Game.getObjectById(memory.storeId)) === null || _a === void 0 ? void 0 : _a.store.getFreeCapacity(RESOURCE_ENERGY)) === 0) {
            creep.memory.siteId = undefined;
        }
        if (!memory.storeId) {
            creep.memory.storeId = (_b = creep.pos.findClosestByPath([...container, ...spawn, ...extension, ...storage, ...link, ...terminal].filter((s) => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0))) === null || _b === void 0 ? void 0 : _b.id;
        }
        const store = memory.storeId && Game.getObjectById(memory.storeId);
        if (!store || store.pos.roomName !== memory.baseRoom) {
            creep.memory.harvestTargetId = undefined;
            return ERR_NOT_FOUND;
        }
        Object.keys(creep.store).forEach((resourceType) => {
            if ((creep.memory.worked = creep.transfer(store, resourceType)) === ERR_NOT_IN_RANGE && memory.mode === "🚛") {
                return (0, util_creep_1.customMove)(creep, store);
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
