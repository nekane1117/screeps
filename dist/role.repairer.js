"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const behavior = (creep) => {
    var _a, _b, _c;
    if (!isRepairer(creep)) {
        return console.log(`${creep.name} is not Repairer`);
    }
    if (creep.memory.workTargetId ||
        (creep.memory.workTargetId = (_a = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => s.structureType !== STRUCTURE_WALL && s.hits < s.hitsMax,
        })) === null || _a === void 0 ? void 0 : _a.id)) {
        const target = Game.getObjectById(creep.memory.workTargetId);
        if (target && target.hits < target.hitsMax) {
            creep.memory.worked = creep.repair(target);
            switch (creep.memory.worked) {
                case ERR_NOT_ENOUGH_RESOURCES:
                    changeMode(creep, "🛒");
                    break;
                case ERR_NOT_OWNER:
                case ERR_NO_BODYPART:
                case ERR_INVALID_TARGET:
                    console.log(`${creep.name} repair returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
                    creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]);
                    break;
                case OK:
                    creep.memory.workTargetId = (_b = _(creep.pos.findInRange(FIND_STRUCTURES, 3, { filter: (s) => s.hits < s.hitsMax })).min((s) => s.hits)) === null || _b === void 0 ? void 0 : _b.id;
                case ERR_NOT_IN_RANGE:
                    if (creep.memory.mode === "💪") {
                        (0, util_creep_1.customMove)(creep, target, {
                            visualizePathStyle: {
                                stroke: "#ffff00",
                            },
                        });
                    }
                    break;
                case ERR_BUSY:
                default:
                    break;
            }
        }
        else {
            creep.memory.workTargetId = undefined;
            (0, util_creep_1.randomWalk)(creep);
        }
    }
    if (creep.memory.storeId ||
        (creep.memory.storeId = (_c = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) => {
                return (0, util_creep_1.isStoreTarget)(s) && ![STRUCTURE_SPAWN, STRUCTURE_EXTENSION].some((t) => t === s.structureType) && s.store.getUsedCapacity(RESOURCE_ENERGY) !== 0;
            },
        })) === null || _c === void 0 ? void 0 : _c.id)) {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store) {
            creep.memory.collected = creep.withdraw(store, RESOURCE_ENERGY);
            switch (creep.memory.collected) {
                case ERR_NOT_ENOUGH_RESOURCES:
                    changeMode(creep, "🛒");
                    break;
                case ERR_INVALID_TARGET:
                    creep.memory.storeId = undefined;
                    break;
                case ERR_FULL:
                    changeMode(creep, "💪");
                    break;
                case ERR_NOT_IN_RANGE:
                    if (creep.memory.mode === "🛒") {
                        const moved = (0, util_creep_1.customMove)(creep, store, { visualizePathStyle: { stroke: "#ffff00" } });
                        moved !== OK && (console.log(`${creep.name} ${util_creep_1.RETURN_CODE_DECODER[moved.toString()]}`), creep.say(util_creep_1.RETURN_CODE_DECODER[moved.toString()]));
                    }
                    break;
                case ERR_NOT_OWNER:
                case ERR_INVALID_ARGS:
                    console.log(`${creep.name} build returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.collected.toString()]}`);
                    creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.collected.toString()]);
                    break;
                case OK:
                case ERR_BUSY:
                default:
                    break;
            }
        }
        else {
            creep.memory.storeId = undefined;
        }
    }
    (0, util_creep_1.pickUpAll)(creep);
    if (creep.store[RESOURCE_ENERGY] === 0) {
        changeMode(creep, "🛒");
    }
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        changeMode(creep, "💪");
    }
};
exports.default = behavior;
function isRepairer(creep) {
    return creep.memory.role === "repairer";
}
function changeMode(creep, mode) {
    if (creep.memory.mode !== mode) {
        creep.say(mode);
        if (mode === "💪") {
            creep.memory.mode = mode;
        }
        else {
            creep.memory.mode = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => {
                    return (0, util_creep_1.isStoreTarget)(s) && s.store.getUsedCapacity(RESOURCE_ENERGY) !== 0;
                },
            })
                ? "🛒"
                : "🌾";
        }
        creep.memory.workTargetId = undefined;
    }
}
