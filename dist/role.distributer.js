"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (creep) => {
    const moveMeTo = (target) => (0, util_creep_1.customMove)(creep, target, {
        ignoreCreeps: !creep.pos.inRangeTo(target, 2),
    });
    if (!isDistributer(creep)) {
        return console.log(`${creep.name} is not Harvester`);
    }
    const source = Game.getObjectById(creep.memory.sourceId);
    if (!source) {
        return creep.suicide();
    }
    const closestContainer = source === null || source === void 0 ? void 0 : source.pos.findClosestByRange((0, utils_1.findMyStructures)(creep.room).container);
    if (!source || !closestContainer) {
        return ERR_NOT_FOUND;
    }
    return (_(OK)
        .tap(() => {
        const capacityRate = (0, utils_1.getCapacityRate)(creep);
        if (capacityRate < 0.25) {
            changeMode(creep, "🛒");
        }
        else if (capacityRate === 1) {
            changeMode(creep, "💪");
        }
    })
        .tap(() => {
        if (creep.memory.mode === "🛒") {
            if (!creep.pos.isNearTo(closestContainer)) {
                moveMeTo(closestContainer);
            }
            if (creep.pos.isNearTo(closestContainer)) {
                creep.memory.worked = creep.withdraw(closestContainer, RESOURCE_ENERGY);
                switch (creep.memory.worked) {
                    case ERR_NOT_IN_RANGE:
                    case ERR_NOT_OWNER:
                    case ERR_INVALID_TARGET:
                    case ERR_INVALID_ARGS:
                        console.log(`${creep.name} withdraw returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
                        creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]);
                        break;
                    case OK:
                    case ERR_FULL:
                    case ERR_BUSY:
                    case ERR_NOT_ENOUGH_RESOURCES:
                    default:
                        break;
                }
            }
        }
        if (creep.store.energy > CARRY_CAPACITY) {
            changeMode(creep, "💪");
        }
    })
        .tap(() => {
        var _a, _b;
        if (creep.memory.mode === "💪") {
            const spawn = creep.pos.findClosestByRange(Object.values(Game.spawns));
            if (!spawn) {
                console.log(`${creep.name} : SPAWN NOT FOUND`);
                return creep.say("SPAWN NOT FOUND");
            }
            if (!creep.memory.transferId) {
                const rangeToSpawn = creep.pos.getRangeTo(spawn);
                const { container, extension, link, storage, spawn: spawns } = (0, utils_1.findMyStructures)(creep.room);
                if (!creep.memory.transferId)
                    creep.memory.transferId = (_b = (((_a = source.pos.findInRange(FIND_STRUCTURES, 3, {
                        filter: (s) => {
                            return s.structureType === STRUCTURE_LINK && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                        },
                    })) === null || _a === void 0 ? void 0 : _a[0]) ||
                        creep.pos.findClosestByRange([...spawns, ...container, ...extension, ...link, ...storage], {
                            filter: (s) => {
                                return s.id !== closestContainer.id && (0, utils_1.getCapacityRate)(s) < 1 && s.pos.getRangeTo(spawn) < rangeToSpawn;
                            },
                        }))) === null || _b === void 0 ? void 0 : _b.id;
            }
            if (!creep.memory.transferId) {
                return moveMeTo(closestContainer);
            }
            const transferTarget = Game.getObjectById(creep.memory.transferId);
            if (!transferTarget) {
                return (creep.memory.transferId = undefined);
            }
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
                        break;
                }
            }
        }
    })
        .tap(() => {
        (0, util_creep_1.pickUpAll)(creep);
    })
        .run());
};
exports.default = behavior;
function isDistributer(creep) {
    return creep.memory.role === "distributer";
}
function changeMode(creep, mode) {
    if (creep.memory.mode !== mode) {
        creep.say(mode);
        creep.memory.mode = mode;
        creep.memory.transferId = undefined;
    }
}
