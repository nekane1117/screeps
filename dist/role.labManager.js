"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const TRANSFER_THRESHOLD = 1000;
const behavior = (creep) => {
    var _a, _b, _c, _d, _e;
    const { room } = creep;
    const terminal = room.terminal;
    if (!terminal) {
        return ERR_NOT_FOUND;
    }
    const moveMeTo = (target, opt) => (0, util_creep_1.customMove)(creep, target, Object.assign({ swampCost: 1, plainCost: 1 }, opt));
    if (!isLabManager(creep)) {
        return console.log(`${creep.name} is not LabManager`);
    }
    function checkMode() {
        var _a;
        if (!isLabManager(creep)) {
            return console.log(`${creep.name} is not LabManager`);
        }
        const newMode = creep.store.getUsedCapacity() === 0 ? "🛒" : "🚛";
        if (creep.memory.mode !== newMode) {
            creep.say(newMode);
            creep.memory.mode = newMode;
            if (newMode === "🛒") {
                creep.memory.storeId = undefined;
                creep.memory.mineralType = undefined;
            }
            creep.memory.transferId = undefined;
            if (newMode === "🚛") {
                (creep.room.memory.carrySize = creep.room.memory.carrySize || {}).labManager =
                    ((((_a = creep.room.memory.carrySize) === null || _a === void 0 ? void 0 : _a.labManager) || 100) * 100 + creep.store.getUsedCapacity()) / 101;
            }
        }
    }
    checkMode();
    const { factory } = (0, utils_1.findMyStructures)(creep.room);
    const labs = _([factory && Object.assign(factory, factory && { memory: Memory.factories[factory.id] }), ...(0, utils_1.getLabs)(room).value()]).compact();
    if (creep.memory.storeId) {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store && "store" in store && store.store.energy < CARRY_CAPACITY) {
            creep.memory.storeId = undefined;
        }
    }
    const { wrong, requesting, completed } = labs
        .sortBy((l) => {
        return l.memory.expectedType;
    })
        .reduce((mapping, structure) => {
        if (structure.structureType === STRUCTURE_FACTORY) {
            if (structure.memory.outputType) {
                mapping.completed.push(structure);
            }
            if (structure.memory.expectedType) {
                mapping.requesting.push(structure);
            }
        }
        else {
            if (structure.mineralType) {
                if (structure.mineralType !== structure.memory.expectedType) {
                    mapping.wrong.push(structure);
                }
                else if ((0, utils_1.isCompound)(structure.mineralType)) {
                    if (structure.store[structure.mineralType] > TRANSFER_THRESHOLD * 2) {
                        mapping.completed.push(structure);
                    }
                    else if (structure.store[structure.mineralType] <= TRANSFER_THRESHOLD) {
                        mapping.requesting.push(structure);
                    }
                    else {
                        mapping.noProblem.push(structure);
                    }
                }
                else {
                    if (structure.store.getFreeCapacity(structure.mineralType) > 1000) {
                        mapping.requesting.push(structure);
                    }
                    else {
                        mapping.noProblem.push(structure);
                    }
                }
            }
            else {
                if (structure.memory.expectedType.length >= 2) {
                    mapping.noProblem.push(structure);
                }
                else {
                    mapping.requesting.push(structure);
                }
            }
        }
        return mapping;
    }, {
        completed: [],
        noProblem: [],
        requesting: [],
        wrong: [],
    });
    if (!creep.memory.storeId && wrong.length > 0) {
        creep.memory.storeId = (_a = _(wrong).first()) === null || _a === void 0 ? void 0 : _a.id;
    }
    if (!creep.memory.storeId) {
        creep.memory.storeId = (_b = _(completed).first()) === null || _b === void 0 ? void 0 : _b.id;
    }
    if (!creep.memory.storeId) {
        const req = requesting.find((r) => r.memory.expectedType && terminal.store[r.memory.expectedType] + creep.store.getCapacity(r.memory.expectedType) > 0);
        if (req) {
            creep.memory.storeId = (_c = creep.room.terminal) === null || _c === void 0 ? void 0 : _c.id;
            creep.memory.mineralType = req.memory.expectedType;
        }
    }
    if (creep.memory.mineralType && (0, util_creep_1.pickUpAll)(creep, creep.memory.mineralType) === OK) {
        return;
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
                    else if (store.structureType === STRUCTURE_FACTORY) {
                        const memory = Memory.factories[store.id];
                        if (memory.outputType) {
                            return creep.withdraw(store, memory.outputType, Math.min(creep.store.getCapacity(memory.outputType), Math.max(0, store.store[memory.outputType] - TRANSFER_THRESHOLD * 2)));
                        }
                        else {
                            creep.memory.storeId = undefined;
                            creep.memory.mineralType = undefined;
                            return ERR_INVALID_ARGS;
                        }
                    }
                    else {
                        if (store.mineralType) {
                            return creep.withdraw(store, store.mineralType, Math.min(creep.store.getCapacity(store.mineralType), store.store[store.mineralType]));
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
                        console.log(`${creep.name} withdraw returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
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
    const currentType = (_d = Object.entries(creep.store).find(([_type, amount]) => amount)) === null || _d === void 0 ? void 0 : _d[0];
    if (creep.memory.transferId) {
        const store = Game.getObjectById(creep.memory.transferId);
        if (store && "store" in store && store.store.getFreeCapacity(currentType) === 0) {
            creep.memory.transferId = undefined;
        }
    }
    if (!creep.memory.transferId) {
        if (!currentType) {
            return ERR_NOT_ENOUGH_RESOURCES;
        }
        if (!creep.memory.transferId) {
            creep.memory.transferId = (_e = requesting.find((lab) => lab.memory.expectedType === currentType)) === null || _e === void 0 ? void 0 : _e.id;
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
};
exports.default = behavior;
function isLabManager(creep) {
    return creep.memory.role === "labManager";
}
