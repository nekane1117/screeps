"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (creep) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const moveMeTo = (target, opt) => (0, util_creep_1.customMove)(creep, target, Object.assign({ ignoreCreeps: !creep.pos.inRangeTo(target, 2) }, opt));
    const logger = (..._args) => {
    };
    if (!isGatherer(creep)) {
        return console.log(`${creep.name} is not Gatherer`);
    }
    function checkMode() {
        if (!isGatherer(creep)) {
            return console.log(`${creep.name} is not Gatherer`);
        }
        const newMode = creep.store.energy < CARRY_CAPACITY ? "🛒" : "💪";
        if (creep.memory.mode !== newMode) {
            creep.say(newMode);
            creep.memory.mode = newMode;
            if (newMode === "🛒") {
                creep.memory.storeId = undefined;
            }
            creep.memory.transferId = undefined;
        }
    }
    const spawn = _((0, util_creep_1.getSpawnsInRoom)(creep.room)).first();
    if (!spawn) {
        return ERR_NOT_FOUND;
    }
    const { extension, spawn: spawns, link, tower, storage, terminal, container: containers } = (0, utils_1.findMyStructures)(creep.room);
    const controllerContaeiner = (_a = creep.room.controller) === null || _a === void 0 ? void 0 : _a.pos.findClosestByRange(containers);
    if (creep.memory.transferId) {
        const store = Game.getObjectById(creep.memory.transferId);
        if (store && "store" in store && store.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
            creep.memory.transferId = undefined;
        }
    }
    const exclusive = ({ id }) => (0, util_creep_1.getCreepsInRoom)(creep.room)
        .filter((c) => c.memory.role === "gatherer")
        .every((g) => g.memory.transferId !== id);
    if (!creep.memory.transferId) {
        logger("search extension");
        if ((creep.memory.transferId = (_b = creep.pos.findClosestByRange([...extension, ...spawns], {
            filter: (s) => {
                return s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && exclusive(s);
            },
        })) === null || _b === void 0 ? void 0 : _b.id)) {
            logger("store to extension", creep.memory.transferId);
        }
    }
    if (!creep.memory.transferId) {
        logger("search cache to storage");
        if ((creep.memory.transferId = (_c = storage.find((s) => s.store.energy < s.room.energyCapacityAvailable)) === null || _c === void 0 ? void 0 : _c.id)) {
            logger("cache to storage", creep.memory.transferId);
        }
    }
    if (!creep.memory.transferId) {
        logger("search tower");
        if ((creep.memory.transferId = (_d = creep.pos.findClosestByRange(tower, {
            filter: (t) => {
                return (0, utils_1.getCapacityRate)(t) < 1 && exclusive(t);
            },
        })) === null || _d === void 0 ? void 0 : _d.id)) {
            logger("store to tower", creep.memory.transferId);
        }
    }
    if (!creep.memory.transferId) {
        logger("search controller contaeiner");
        if ((creep.memory.transferId = (_e = (controllerContaeiner && (0, utils_1.getCapacityRate)(controllerContaeiner) < 0.9 ? controllerContaeiner : undefined)) === null || _e === void 0 ? void 0 : _e.id)) {
            logger("store to controller contaeiner", creep.memory.transferId);
        }
    }
    if (!creep.memory.transferId) {
        logger("search any storage");
        if ((creep.memory.transferId = (_f = spawn.pos.findClosestByRange([...link, ...storage, ...terminal, ...containers], {
            filter: (s) => {
                return s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            },
        })) === null || _f === void 0 ? void 0 : _f.id)) {
            logger("cache to storage", creep.memory.transferId);
        }
    }
    if (!creep.memory.transferId) {
        return ERR_NOT_FOUND;
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
        creep.memory.storeId = (_g = ((() => {
            const extructor = spawn.pos.findClosestByRange(link);
            return extructor && extructor.store.energy >= CARRY_CAPACITY ? extructor : undefined;
        })() ||
            creep.pos.findClosestByRange(_.compact([...storage, ...terminal, ...containers]), {
                filter: (s) => {
                    return (controllerContaeiner === null || controllerContaeiner === void 0 ? void 0 : controllerContaeiner.id) !== s.id && transferTarget.id !== s.id && s.store.getUsedCapacity(RESOURCE_ENERGY) >= CARRY_CAPACITY;
                },
            }))) === null || _g === void 0 ? void 0 : _g.id;
    }
    if (!creep.memory.storeId) {
        return ERR_NOT_FOUND;
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
        }
    }
    (0, util_creep_1.stealBy)(creep, ["harvester", "distributer"]);
    (0, util_creep_1.pickUpAll)(creep);
};
exports.default = behavior;
function isGatherer(creep) {
    return creep.memory.role === "gatherer";
}
