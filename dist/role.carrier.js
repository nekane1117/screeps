"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findTransferTarget = void 0;
const constants_1 = require("./constants");
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (creep) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const { room } = creep;
    const moveMeTo = (target, opt) => {
        (0, util_creep_1.customMove)(creep, target, Object.assign({ plainCost: 2, swampCost: 5, ignoreCreeps: true }, opt));
    };
    if (!isCarrier(creep)) {
        return console.log(`${creep.name} is not Carrier`);
    }
    function checkMode() {
        var _a;
        if (!isCarrier(creep)) {
            return console.log(`${creep.name} is not Carrier`);
        }
        const newMode = ((c) => {
            if (c.memory.mode === "🚛" && creep.store.energy === 0) {
                return "🛒";
            }
            if (c.memory.mode === "🛒" &&
                creep.store.energy >=
                    Math.min(creep.store.getCapacity(RESOURCE_ENERGY), creep.room.controller ? EXTENSION_ENERGY_CAPACITY[creep.room.controller.level] : CARRY_CAPACITY)) {
                return "🚛";
            }
            return c.memory.mode;
        })(creep);
        if (creep.memory.mode !== newMode) {
            creep.say(newMode);
            creep.memory.mode = newMode;
            if (newMode === "🛒") {
                creep.memory.storeId = undefined;
            }
            creep.memory.transferId = undefined;
            if (newMode === "🚛") {
                (creep.room.memory.carrySize = creep.room.memory.carrySize || {}).carrier =
                    ((((_a = creep.room.memory.carrySize) === null || _a === void 0 ? void 0 : _a.carrier) || 100) * 100 + creep.store.energy) / 101;
            }
        }
    }
    checkMode();
    const canter = room.storage || (0, util_creep_1.getMainSpawn)(room);
    if (!canter) {
        return creep.say("canter not found");
    }
    const { extension, spawn: spawns, link, container: containers } = (0, utils_1.findMyStructures)(room);
    const controllerContaeiner = room.controller && _(room.controller.pos.findInRange(containers, 3)).first();
    if (creep.memory.storeId) {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store && "store" in store && store.store.energy < CARRY_CAPACITY) {
            creep.memory.storeId = undefined;
        }
    }
    if (!creep.memory.storeId) {
        creep.memory.storeId = (_a = (() => {
            const extructor = canter.pos.findClosestByRange(link);
            return extructor && extructor.store.energy >= CARRY_CAPACITY ? extructor : undefined;
        })()) === null || _a === void 0 ? void 0 : _a.id;
    }
    if (!creep.memory.storeId && room.energyAvailable < room.energyCapacityAvailable) {
        creep.memory.storeId = (_b = creep.pos.findClosestByRange(_.compact([room.storage, ...containers]), {
            filter: (s) => {
                return (containers.length < 2 || (controllerContaeiner === null || controllerContaeiner === void 0 ? void 0 : controllerContaeiner.id) !== s.id) && s.store.energy > 0;
            },
        })) === null || _b === void 0 ? void 0 : _b.id;
    }
    if (!creep.memory.storeId && room.energyAvailable < room.energyCapacityAvailable && (((_c = room.terminal) === null || _c === void 0 ? void 0 : _c.store.energy) || 0) >= CARRY_CAPACITY) {
        creep.memory.storeId = (_d = room.terminal) === null || _d === void 0 ? void 0 : _d.id;
    }
    if (!creep.memory.storeId) {
        creep.memory.storeId = (_e = creep.pos.findClosestByRange(containers, {
            filter: (s) => {
                return (containers.length < 2 || (controllerContaeiner === null || controllerContaeiner === void 0 ? void 0 : controllerContaeiner.id) !== s.id) && s.store.energy >= CARRY_CAPACITY;
            },
        })) === null || _e === void 0 ? void 0 : _e.id;
    }
    if (!creep.memory.storeId) {
        creep.memory.storeId = (_f = creep.pos.findClosestByRange(_.compact([room.storage, room.terminal]), {
            filter: (s) => {
                return s.store.energy >= room.energyCapacityAvailable + creep.store.getCapacity(RESOURCE_ENERGY);
            },
        })) === null || _f === void 0 ? void 0 : _f.id;
    }
    if (!creep.memory.storeId) {
        const storageOrHarvester = creep.room.storage ||
            creep.room.terminal ||
            creep.pos.findClosestByRange((0, util_creep_1.getCreepsInRoom)(creep.room).harvester || [], {
                filter: (c) => {
                    return c.store.energy > ((c === null || c === void 0 ? void 0 : c.getActiveBodyparts(WORK)) || 0) * BUILD_POWER;
                },
            });
        if (storageOrHarvester && !creep.pos.isNearTo(storageOrHarvester)) {
            moveMeTo(storageOrHarvester, { range: 1 });
        }
    }
    if (creep.memory.storeId && creep.memory.mode === "🛒") {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store) {
            if (!creep.pos.isNearTo(store)) {
                moveMeTo(store, { range: 1 });
            }
            if (creep.pos.isNearTo(store)) {
                creep.memory.worked = creep.withdraw(store, RESOURCE_ENERGY);
                switch (creep.memory.worked) {
                    case ERR_NOT_ENOUGH_RESOURCES:
                        creep.memory.storeId = undefined;
                        checkMode();
                        break;
                    case ERR_FULL:
                        checkMode();
                        break;
                    case ERR_NOT_IN_RANGE:
                    case ERR_NOT_OWNER:
                    case ERR_INVALID_TARGET:
                    case ERR_INVALID_ARGS:
                        console.log(`${creep.name} transfer returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
                        creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]);
                        break;
                    case OK:
                    case ERR_BUSY:
                    default:
                        creep.memory.storeId = undefined;
                        checkMode();
                        break;
                }
            }
        }
    }
    if (creep.memory.transferId) {
        const store = Game.getObjectById(creep.memory.transferId);
        if (store && "store" in store && store.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
            creep.memory.transferId = undefined;
        }
    }
    creep.memory.transferId = creep.memory.transferId || ((_g = findTransferTarget(creep.room)) === null || _g === void 0 ? void 0 : _g.id);
    if (!creep.memory.transferId) {
        creep.memory.transferId = (_h = _((0, util_creep_1.getCreepsInRoom)(creep.room).builder || [])
            .compact()
            .sortBy((s) => s.store.energy)
            .first()) === null || _h === void 0 ? void 0 : _h.id;
    }
    if (!creep.memory.transferId) {
        return ERR_NOT_FOUND;
    }
    if (creep.memory.transferId && creep.memory.mode === "🚛") {
        const transferTarget = Game.getObjectById(creep.memory.transferId);
        if (transferTarget) {
            if (!creep.pos.isNearTo(transferTarget)) {
                moveMeTo(transferTarget, { range: 1 });
            }
            if (creep.pos.isNearTo(transferTarget)) {
                const returnVal = creep.transfer(transferTarget, RESOURCE_ENERGY);
                switch (returnVal) {
                    case ERR_NOT_ENOUGH_RESOURCES:
                        checkMode();
                        break;
                    case ERR_INVALID_TARGET:
                    case ERR_FULL:
                        creep.memory.transferId = undefined;
                        break;
                    case ERR_NOT_IN_RANGE:
                    case ERR_NOT_OWNER:
                    case ERR_INVALID_ARGS:
                        console.log(`${creep.name} transfer returns ${util_creep_1.RETURN_CODE_DECODER[returnVal.toString()]}`);
                        creep.say(util_creep_1.RETURN_CODE_DECODER[returnVal.toString()]);
                        break;
                    case OK:
                    case ERR_BUSY:
                    default:
                        if ((0, utils_1.getCapacityRate)(transferTarget) > 0.9) {
                            creep.memory.transferId = undefined;
                        }
                        break;
                }
            }
            else {
                _([...extension, ...spawns].filter((e) => creep.pos.isNearTo(e) && e.store.getFreeCapacity(RESOURCE_ENERGY)))
                    .tap(([head]) => {
                    if (head) {
                        creep.transfer(head, RESOURCE_ENERGY);
                    }
                })
                    .run();
            }
        }
        else {
            creep.memory.transferId = undefined;
        }
    }
    (0, util_creep_1.withdrawBy)(creep, ["harvester"]);
    (0, util_creep_1.pickUpAll)(creep);
};
exports.default = behavior;
function isCarrier(creep) {
    return creep.memory.role === "carrier";
}
function findTransferTarget(room) {
    var _a, _b;
    const canter = room.storage || (0, util_creep_1.getMainSpawn)(room);
    if (!canter) {
        console.log(room.name, "center not found");
        return null;
    }
    const { extension, spawn, tower, container, factory } = (0, utils_1.findMyStructures)(room);
    const controllerContaeiner = room.controller && _(room.controller.pos.findInRange(container, 3)).first();
    return (_([...extension, ...spawn])
        .filter((s) => s.store.getFreeCapacity(RESOURCE_ENERGY) &&
        !_(Object.values((0, util_creep_1.getCreepsInRoom)(room)))
            .flatten()
            .find((c) => c.memory && "transferId" in c.memory && c.memory.transferId === s.id))
        .sortBy((e) => {
        return Math.atan2(e.pos.y - canter.pos.y, canter.pos.x - e.pos.x);
    })
        .first() ||
        canter.pos.findClosestByRange(tower, {
            filter: (t) => {
                return (0, utils_1.getCapacityRate)(t) < 0.9;
            },
        }) ||
        ((((_a = room.terminal) === null || _a === void 0 ? void 0 : _a.store.energy) || 0) < room.energyCapacityAvailable ? room.terminal : null) ||
        (0, utils_1.getLabs)(room)
            .filter((lab) => (0, utils_1.getCapacityRate)(lab) < 0.8)
            .sort((l1, l2) => l1.store.energy - l2.store.energy)
            .first() ||
        ((((_b = room.storage) === null || _b === void 0 ? void 0 : _b.store.energy) || 0) < room.energyCapacityAvailable ? room.storage : null) ||
        (controllerContaeiner && (0, utils_1.getCapacityRate)(controllerContaeiner) < 0.9 ? controllerContaeiner : null) ||
        (((factory === null || factory === void 0 ? void 0 : factory.store.energy) || 0) < room.energyCapacityAvailable ? factory : null) ||
        _([room.storage, room.terminal])
            .compact()
            .filter((s) => s.store.energy < constants_1.TERMINAL_LIMIT)
            .sortBy((s) => s.store.energy)
            .first());
}
exports.findTransferTarget = findTransferTarget;
