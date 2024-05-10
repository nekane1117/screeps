"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (creep) => {
    var _a, _b, _c;
    const moveMeTo = (target, opt) => (0, util_creep_1.customMove)(creep, target, Object.assign({ ignoreCreeps: !creep.pos.inRangeTo(target, 2) }, opt));
    if (!isGatherer(creep)) {
        return console.log(`${creep.name} is not Gatherer`);
    }
    const capacityRate = (0, utils_1.getCapacityRate)(creep);
    if (capacityRate < 0.25) {
        changeMode(creep, "🛒");
    }
    if (capacityRate > 0) {
        changeMode(creep, "💪");
    }
    const spawn = _((0, util_creep_1.getSpawnsInRoom)(creep.room)).first();
    if (!spawn) {
        return ERR_NOT_FOUND;
    }
    const { extension, spawn: spawns, link, tower, storage, terminal, container: containers } = (0, utils_1.findMyStructures)(creep.room);
    if (creep.memory.transferId) {
        const store = Game.getObjectById(creep.memory.transferId);
        if (store && "store" in store && store.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
            creep.memory.transferId = undefined;
        }
    }
    if (!creep.memory.transferId) {
        const controllerContaeiner = (_a = creep.room.controller) === null || _a === void 0 ? void 0 : _a.pos.findClosestByRange(containers);
        creep.memory.transferId =
            (_b = (creep.pos.findClosestByRange([...extension, ...spawns], {
                filter: (s) => {
                    return s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                },
            }) ||
                creep.pos.findClosestByRange(tower, {
                    filter: (t) => {
                        return (0, utils_1.getCapacityRate)(t) <= 0.8;
                    },
                }) ||
                (controllerContaeiner && (0, utils_1.getCapacityRate)(controllerContaeiner) < 0.9 ? controllerContaeiner : undefined) ||
                spawn.pos.findClosestByRange([...link, ...storage, ...terminal, ...containers], {
                    filter: (s) => {
                        return s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    },
                }))) === null || _b === void 0 ? void 0 : _b.id;
    }
    if (!creep.memory.transferId) {
        return moveMeTo(spawn, {
            range: 3,
        });
    }
    const transferTarget = Game.getObjectById(creep.memory.transferId);
    if (!transferTarget) {
        creep.memory.transferId = undefined;
        return ERR_NOT_FOUND;
    }
    if (creep.memory.storeId) {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store && "store" in store && store.store.energy === 0) {
            creep.memory.storeId = undefined;
        }
    }
    if (!creep.memory.storeId) {
        const rangeToSpawn = spawn.pos.getRangeTo(transferTarget);
        creep.memory.storeId = (_c = ((() => {
            const extructor = spawn.pos.findClosestByRange(link);
            return extructor && extructor.store.energy >= CARRY_CAPACITY ? extructor : undefined;
        })() ||
            creep.pos.findClosestByRange(_.compact([...storage, ...terminal, ...containers]), {
                filter: (s) => {
                    return transferTarget.id !== s.id && s.store.getUsedCapacity(RESOURCE_ENERGY) >= CARRY_CAPACITY && spawn.pos.getRangeTo(s) >= rangeToSpawn;
                },
            }))) === null || _c === void 0 ? void 0 : _c.id;
    }
    if (!creep.memory.storeId) {
        return moveMeTo(spawn, {
            range: 3,
        });
    }
    if (creep.memory.mode === "🛒") {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store) {
            if (!creep.pos.isNearTo(store)) {
                moveMeTo(store);
            }
            if (creep.pos.isNearTo(store)) {
                creep.memory.worked = creep.withdraw(store, RESOURCE_ENERGY);
                switch (creep.memory.worked) {
                    case ERR_NOT_ENOUGH_RESOURCES:
                        creep.memory.storeId = undefined;
                        if (creep.store.energy > CARRY_CAPACITY) {
                            changeMode(creep, "💪");
                        }
                        break;
                    case ERR_FULL:
                        changeMode(creep, "💪");
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
                        if (creep.store.energy > 0 && store.store.energy < creep.getActiveBodyparts(CARRY) * CARRY_CAPACITY) {
                            changeMode(creep, "💪");
                        }
                        break;
                }
            }
        }
    }
    if (creep.memory.mode === "💪") {
        const transferTarget = Game.getObjectById(creep.memory.transferId);
        if (transferTarget) {
            if (!creep.pos.isNearTo(transferTarget)) {
                moveMeTo(transferTarget);
            }
            if (creep.pos.isNearTo(transferTarget)) {
                const returnVal = creep.transfer(transferTarget, RESOURCE_ENERGY);
                switch (returnVal) {
                    case ERR_NOT_ENOUGH_RESOURCES:
                        changeMode(creep, "🛒");
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
        }
    }
    (0, util_creep_1.stealBy)(creep, ["harvester", "distributer"]);
    (0, util_creep_1.pickUpAll)(creep);
};
exports.default = behavior;
function isGatherer(creep) {
    return creep.memory.role === "gatherer";
}
function changeMode(creep, mode) {
    if (creep.memory.mode !== mode) {
        creep.say(mode);
        creep.memory.mode = mode;
        if (mode === "🛒") {
            creep.memory.storeId = undefined;
        }
        creep.memory.transferId = undefined;
    }
}
