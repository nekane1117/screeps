"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (creep) => {
    var _a, _b;
    const moveMeTo = (target, opt) => {
        return (0, util_creep_1.customMove)(creep, target, Object.assign({}, opt));
    };
    if (!isMc(creep)) {
        return console.log(`${creep.name} is not MineralCarrier`);
    }
    const mineral = creep.room.find(FIND_MINERALS)[0];
    function checkMode() {
        if (!isMc(creep)) {
            return console.log(`${creep.name} is not MineralCarrier`);
        }
        const newMode = ((c) => {
            if (c.memory.mode === "🚛" && creep.store.getUsedCapacity() === 0) {
                return "🛒";
            }
            if (c.memory.mode === "🛒" && creep.store.getUsedCapacity() > CARRY_CAPACITY) {
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
                creep.room.memory.carrySize.mineralCarrier = (creep.room.memory.carrySize.mineralCarrier * 100 + creep.store[mineral.mineralType]) / 101;
            }
        }
    }
    checkMode();
    if (!mineral) {
        return creep.suicide();
    }
    if (creep.memory.storeId) {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store && "store" in store && store.store.energy === 0) {
            creep.memory.storeId = undefined;
        }
    }
    const { container } = (0, utils_1.findMyStructures)(creep.room);
    const mineralHarvester = (0, util_creep_1.getCreepsInRoom)(creep.room).mineralHarvester || [];
    if (!creep.memory.storeId) {
        creep.memory.storeId = (_a = mineral.pos.findClosestByRange([...container, ...mineralHarvester], {
            filter: (s) => {
                return s.store[mineral.mineralType] > CARRY_CAPACITY;
            },
        })) === null || _a === void 0 ? void 0 : _a.id;
    }
    if (creep.memory.storeId && creep.memory.mode === "🛒") {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store) {
            if (!creep.pos.isNearTo(store)) {
                moveMeTo(store);
            }
            if (creep.pos.isNearTo(store)) {
                creep.memory.worked = "name" in store ? store.transfer(creep, mineral.mineralType) : creep.withdraw(store, mineral.mineralType);
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
    if (creep.memory.transferId) {
        const store = Game.getObjectById(creep.memory.transferId);
        if (store && "store" in store && store.store.getFreeCapacity(mineral.mineralType) === 0) {
            creep.memory.transferId = undefined;
        }
    }
    if (!creep.memory.transferId) {
        creep.memory.transferId = (_b = creep.room.terminal) === null || _b === void 0 ? void 0 : _b.id;
    }
    if (!creep.memory.transferId) {
        return ERR_NOT_FOUND;
    }
    if (creep.memory.transferId && creep.memory.mode === "🚛") {
        const transferTarget = Game.getObjectById(creep.memory.transferId);
        if (transferTarget) {
            if (!creep.pos.isNearTo(transferTarget)) {
                moveMeTo(transferTarget);
            }
            if (creep.pos.isNearTo(transferTarget)) {
                Object.keys(creep.store).forEach((type) => {
                    const returnVal = creep.transfer(transferTarget, type);
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
                });
            }
        }
    }
    (0, util_creep_1.withdrawBy)(creep, ["mineralHarvester"], mineral.mineralType);
    (0, util_creep_1.pickUpAll)(creep, mineral.mineralType);
};
exports.default = behavior;
function isMc(creep) {
    return creep.memory.role === "mineralCarrier";
}
