"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const MINERAL_KEEP_VALUE = 500;
const behavior = (creep) => {
    var _a, _b, _c, _d;
    const { room } = creep;
    const terminal = room.terminal;
    if (!terminal) {
        return ERR_NOT_FOUND;
    }
    const moveMeTo = (target, opt) => (0, util_creep_1.customMove)(creep, target, Object.assign({ ignoreCreeps: !creep.pos.inRangeTo(target, 2) }, opt));
    if (!isLabManager(creep)) {
        return console.log(`${creep.name} is not LabManager`);
    }
    function checkMode() {
        if (!isLabManager(creep)) {
            return console.log(`${creep.name} is not LabManager`);
        }
        const newMode = creep.store.getUsedCapacity() < CARRY_CAPACITY ? "🛒" : "🚛";
        if (creep.memory.mode !== newMode) {
            creep.say(newMode);
            creep.memory.mode = newMode;
            if (newMode === "🛒") {
                creep.memory.storeId = undefined;
                creep.memory.mineralType = undefined;
            }
            creep.memory.transferId = undefined;
        }
    }
    checkMode();
    const { lab } = (0, utils_1.findMyStructures)(room);
    if (creep.memory.storeId) {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store && "store" in store && store.store.energy < CARRY_CAPACITY) {
            creep.memory.storeId = undefined;
        }
    }
    const { wrong, requesting, completed } = lab
        .map((lab) => {
        return Object.assign(lab, {
            memory: creep.room.memory.labs[lab.id],
        });
    })
        .sort((l1, l2) => {
        return l2.memory.expectedType.length - l1.memory.expectedType.length;
    })
        .reduce((mapping, lab) => {
        if (lab.mineralType) {
            if (lab.mineralType !== lab.memory.expectedType) {
                mapping.wrong.push(lab);
            }
            else if (lab.mineralType.length >= 2) {
                if (lab.store[lab.mineralType] > MINERAL_KEEP_VALUE * 2) {
                    mapping.completed.push(lab);
                }
                else {
                    mapping.noProblem.push(lab);
                }
            }
            else {
                if (lab.store.getFreeCapacity(lab.mineralType) > 1000) {
                    mapping.requesting.push(lab);
                }
                else {
                    mapping.noProblem.push(lab);
                }
            }
        }
        else {
            if (lab.memory.expectedType.length >= 2) {
                mapping.noProblem.push(lab);
            }
            else {
                mapping.requesting.push(lab);
            }
        }
        return mapping;
    }, {
        completed: [],
        noProblem: [],
        requesting: [],
        wrong: [],
    });
    if (!creep.memory.storeId) {
        creep.memory.storeId = (_a = _(wrong).first()) === null || _a === void 0 ? void 0 : _a.id;
    }
    if (!creep.memory.storeId) {
        const target = _(requesting)
            .filter((lab) => terminal.store[lab.memory.expectedType] > 0)
            .first();
        if (target) {
            creep.memory.storeId = terminal.id;
            creep.memory.mineralType = target.memory.expectedType;
        }
    }
    if (!creep.memory.storeId) {
        creep.memory.storeId = (_b = _(completed).first()) === null || _b === void 0 ? void 0 : _b.id;
    }
    if (creep.memory.storeId && creep.memory.mode === "🛒") {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store) {
            if (!creep.pos.isNearTo(store)) {
                moveMeTo(store);
            }
            if (creep.pos.isNearTo(store)) {
                creep.memory.worked = ((creep) => {
                    if (store.structureType === STRUCTURE_TERMINAL) {
                        if (creep.memory.mineralType) {
                            return creep.withdraw(store, creep.memory.mineralType);
                        }
                        else {
                            creep.memory.storeId = undefined;
                            creep.memory.mineralType = undefined;
                            return ERR_INVALID_ARGS;
                        }
                    }
                    else {
                        if (store.mineralType) {
                            return creep.withdraw(store, store.mineralType, store.store[store.mineralType] - MINERAL_KEEP_VALUE);
                        }
                        else {
                            creep.memory.storeId = undefined;
                            creep.memory.mineralType = undefined;
                            return ERR_INVALID_ARGS;
                        }
                    }
                })(creep);
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
    const currentType = (_c = Object.entries(creep.store).find(([_type, amount]) => amount)) === null || _c === void 0 ? void 0 : _c[0];
    if (creep.memory.transferId) {
        const store = Game.getObjectById(creep.memory.transferId);
        if (store && "store" in store && store.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
            creep.memory.transferId = undefined;
        }
    }
    if (!creep.memory.transferId) {
        if (!currentType) {
            return ERR_NOT_ENOUGH_RESOURCES;
        }
        if (currentType.length === 1) {
            creep.memory.transferId = (_d = requesting.find((lab) => lab.memory.expectedType === currentType)) === null || _d === void 0 ? void 0 : _d.id;
        }
        if (!creep.memory.transferId) {
            creep.memory.transferId = terminal.id;
        }
    }
    if (creep.memory.transferId && creep.memory.mode === "🚛") {
        const transferTarget = Game.getObjectById(creep.memory.transferId);
        if (transferTarget) {
            if (!creep.pos.isNearTo(transferTarget)) {
                moveMeTo(transferTarget);
            }
            if (creep.pos.isNearTo(transferTarget)) {
                Object.keys(creep.store).map((resourceType) => {
                    const returnVal = creep.transfer(transferTarget, resourceType);
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
                            console.log(`${creep.name} transfer ${resourceType} returns ${util_creep_1.RETURN_CODE_DECODER[returnVal.toString()]}`);
                            creep.say(util_creep_1.RETURN_CODE_DECODER[returnVal.toString()].replace("ERR_", ""));
                            break;
                        case OK:
                        case ERR_BUSY:
                        default:
                            break;
                    }
                });
            }
        }
        else {
            creep.memory.transferId = undefined;
        }
    }
    (0, util_creep_1.pickUpAll)(creep, currentType);
};
exports.default = behavior;
function isLabManager(creep) {
    return creep.memory.role === "labManager";
}
