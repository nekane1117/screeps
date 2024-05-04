"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const behavior = (creep) => {
    var _a, _b;
    if (!isUpgrader(creep)) {
        return console.log(`${creep.name} is not Upgrader`);
    }
    if (!creep.room.controller) {
        return creep.suicide();
    }
    if (((_a = creep.room.controller.sign) === null || _a === void 0 ? void 0 : _a.username) !== "Nekane" && creep.name.endsWith("0")) {
        const signed = creep.signController(creep.room.controller, "Please teach me screeps");
        if (signed === ERR_NOT_IN_RANGE) {
            (0, util_creep_1.customMove)(creep, creep.room.controller);
        }
        else {
            console.log(`${creep.name}:${util_creep_1.RETURN_CODE_DECODER[signed.toString()]}`);
        }
    }
    creep.memory.worked = creep.upgradeController(creep.room.controller);
    switch (creep.memory.worked) {
        case ERR_NOT_ENOUGH_RESOURCES:
            changeMode(creep, "🛒");
            break;
        case ERR_NOT_IN_RANGE:
            if (creep.memory.mode === "💪") {
                (0, util_creep_1.customMove)(creep, creep.room.controller);
            }
            break;
        case ERR_NOT_OWNER:
        case ERR_INVALID_TARGET:
        case ERR_NO_BODYPART:
            console.log(`${creep.name} upgradeController returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
            creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]);
            break;
        case OK:
        case ERR_BUSY:
        default:
            break;
    }
    if (creep.memory.storeId ||
        (creep.memory.storeId = (_b = (creep.room.controller.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => {
                return (0, util_creep_1.isStoreTarget)(s) && ![STRUCTURE_SPAWN, STRUCTURE_EXTENSION].some((t) => t === s.structureType) && s.store[RESOURCE_ENERGY] > 0;
            },
        }) ||
            creep.room.controller.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (s) => {
                    return ([STRUCTURE_SPAWN, STRUCTURE_EXTENSION].some((t) => t === s.structureType) &&
                        "store" in s &&
                        s.store.getUsedCapacity(RESOURCE_ENERGY) > s.store.getCapacity(RESOURCE_ENERGY) * 0.8);
                },
            }))) === null || _b === void 0 ? void 0 : _b.id)) {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store) {
            creep.memory.collected = creep.withdraw(store, RESOURCE_ENERGY);
            switch (creep.memory.collected) {
                case ERR_NOT_ENOUGH_RESOURCES:
                case ERR_INVALID_TARGET:
                    creep.memory.storeId = undefined;
                    break;
                case ERR_FULL:
                    changeMode(creep, "💪");
                    break;
                case ERR_NOT_IN_RANGE:
                    if (creep.memory.mode === "🛒") {
                        const moved = (0, util_creep_1.customMove)(creep, store);
                        if (moved !== OK) {
                            console.log(`${creep.name} ${util_creep_1.RETURN_CODE_DECODER[moved.toString()]}`);
                            creep.say(util_creep_1.RETURN_CODE_DECODER[moved.toString()]);
                        }
                    }
                    break;
                case ERR_NOT_OWNER:
                case ERR_INVALID_ARGS:
                    console.log(`${creep.name} build returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
                    creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]);
                    break;
                case OK:
                case ERR_BUSY:
                default:
                    break;
            }
        }
        else {
            creep.memory.storeId = undefined;
            (0, util_creep_1.randomWalk)(creep);
        }
    }
    else {
        (0, util_creep_1.randomWalk)(creep);
    }
    (0, util_creep_1.pickUpAll)(creep);
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        changeMode(creep, "💪");
    }
    else if (creep.store[RESOURCE_ENERGY] === 0) {
        changeMode(creep, "🛒");
    }
};
exports.default = behavior;
function isUpgrader(creep) {
    return creep.memory.role === "upgrader";
}
const changeMode = (creep, mode) => {
    if (mode !== creep.memory.mode) {
        creep.say(mode);
        creep.memory.mode = mode;
    }
};
