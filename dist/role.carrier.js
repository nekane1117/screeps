"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (creep) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const moveMeTo = (target, opt) => (0, util_creep_1.customMove)(creep, target, Object.assign({ ignoreCreeps: !creep.pos.inRangeTo(target, 2) }, opt));
    if (!isCarrier(creep)) {
        return console.log(`${creep.name} is not Carrier`);
    }
    function checkMode() {
        if (!isCarrier(creep)) {
            return console.log(`${creep.name} is not Carrier`);
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
    checkMode();
    const spawn = (0, util_creep_1.getMainSpawn)(creep.room);
    if (!spawn) {
        return creep.say("spawn not found");
    }
    const { extension, spawn: spawns, link, tower, storage, terminal, container: containers } = (0, utils_1.findMyStructures)(creep.room);
    const controllerContaeiner = (_a = creep.room.controller) === null || _a === void 0 ? void 0 : _a.pos.findClosestByRange(containers);
    if (creep.memory.storeId) {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store && "store" in store && store.store.energy === 0) {
            creep.memory.storeId = undefined;
        }
    }
    if (!creep.memory.storeId) {
        creep.memory.storeId = (_b = ((() => {
            const extructor = spawn.pos.findClosestByRange(link);
            return extructor && extructor.store.energy >= CARRY_CAPACITY ? extructor : undefined;
        })() ||
            creep.pos.findClosestByRange(_.compact([...storage, ...terminal, ...containers]), {
                filter: (s) => {
                    return (containers.length < 2 || (controllerContaeiner === null || controllerContaeiner === void 0 ? void 0 : controllerContaeiner.id) !== s.id) && s.store.energy >= CARRY_CAPACITY;
                },
            }))) === null || _b === void 0 ? void 0 : _b.id;
    }
    if (creep.memory.storeId && creep.memory.mode === "🛒") {
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
    if (creep.memory.transferId) {
        const store = Game.getObjectById(creep.memory.transferId);
        if (store && "store" in store && store.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
            creep.memory.transferId = undefined;
        }
    }
    const exclusive = ({ id }) => (0, util_creep_1.getCreepsInRoom)(creep.room)
        .filter((c) => c.memory.role === "carrier")
        .every((g) => g.memory.transferId !== id);
    if (!creep.memory.transferId) {
        creep.memory.transferId = (_c = _([...extension, ...spawns])
            .filter((s) => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && exclusive(s))
            .sort((s1, s2) => s1.pos.y - s2.pos.y)
            .first()) === null || _c === void 0 ? void 0 : _c.id;
    }
    if (!creep.memory.transferId) {
        creep.memory.transferId = (_d = storage.find((s) => s.store.energy < s.room.energyCapacityAvailable)) === null || _d === void 0 ? void 0 : _d.id;
    }
    if (!creep.memory.transferId) {
        creep.memory.transferId = (_e = creep.pos.findClosestByRange(tower, {
            filter: (t) => {
                return (0, utils_1.getCapacityRate)(t) < 1 && exclusive(t);
            },
        })) === null || _e === void 0 ? void 0 : _e.id;
    }
    if (!creep.memory.transferId) {
        creep.memory.transferId = (_f = (controllerContaeiner && (0, utils_1.getCapacityRate)(controllerContaeiner) < 0.9 ? controllerContaeiner : undefined)) === null || _f === void 0 ? void 0 : _f.id;
    }
    if (!creep.memory.transferId) {
        creep.memory.transferId = (_g = spawn.pos.findClosestByRange([...link, ...storage, ...terminal, ...containers], {
            filter: (s) => {
                return s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            },
        })) === null || _g === void 0 ? void 0 : _g.id;
    }
    if (!creep.memory.transferId) {
        return ERR_NOT_FOUND;
    }
    if (creep.memory.transferId && creep.memory.mode === "💪") {
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
            else {
                _(extension.filter((e) => creep.pos.isNearTo(e)))
                    .tap(([head]) => {
                    if (head) {
                        creep.transfer(head, RESOURCE_ENERGY);
                    }
                })
                    .run();
            }
        }
    }
    (0, util_creep_1.withdrawBy)(creep, ["harvester"]);
    (0, util_creep_1.pickUpAll)(creep);
};
exports.default = behavior;
function isCarrier(creep) {
    return creep.memory.role === "carrier";
}
