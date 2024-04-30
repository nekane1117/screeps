"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const behavior = (creep) => {
    var _a, _b, _c;
    if (!isBuilder(creep)) {
        return console.log(`${creep.name} is not Builder`);
    }
    if (!(creep.memory.buildingId || (creep.memory.buildingId = (_a = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES)) === null || _a === void 0 ? void 0 : _a.id))) {
        (0, util_creep_1.randomWalk)(creep);
    }
    else {
        const site = Game.getObjectById(creep.memory.buildingId);
        if (site) {
            switch ((creep.memory.built = creep.build(site))) {
                case ERR_NOT_ENOUGH_RESOURCES:
                    changeMode(creep, "collecting");
                    break;
                case ERR_INVALID_TARGET:
                    creep.memory.buildingId = undefined;
                    break;
                case ERR_NOT_IN_RANGE:
                    if (creep.memory.mode === "working") {
                        (0, util_creep_1.customMove)(creep, site);
                    }
                    break;
                case ERR_NOT_OWNER:
                case ERR_NO_BODYPART:
                    console.log(`${creep.name} build returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.built.toString()]}`);
                    creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.built.toString()]);
                    break;
                case OK:
                case ERR_BUSY:
                default:
                    break;
            }
        }
        else {
            creep.memory.buildingId = undefined;
            (0, util_creep_1.randomWalk)(creep);
        }
    }
    if (creep.memory.storeId ||
        (creep.memory.storeId = (_b = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) => {
                return (0, util_creep_1.isStoreTarget)(s) && ![STRUCTURE_SPAWN, STRUCTURE_EXTENSION].some((t) => t === s.structureType) && s.store.getUsedCapacity(RESOURCE_ENERGY) !== 0;
            },
        })) === null || _b === void 0 ? void 0 : _b.id) ||
        (creep.memory.storeId = (_c = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) => {
                return s.structureType === STRUCTURE_SPAWN && s.store.getUsedCapacity(RESOURCE_ENERGY) / s.store.getCapacity(RESOURCE_ENERGY) > 0.8;
            },
        })) === null || _c === void 0 ? void 0 : _c.id)) {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store) {
            creep.memory.worked = creep.withdraw(store, RESOURCE_ENERGY);
            switch (creep.memory.worked) {
                case ERR_NOT_ENOUGH_RESOURCES:
                case ERR_INVALID_TARGET:
                    creep.memory.storeId = undefined;
                    break;
                case ERR_FULL:
                    changeMode(creep, "working");
                    break;
                case ERR_NOT_IN_RANGE:
                    if (creep.memory.mode === "collecting") {
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
        }
    }
    (0, util_creep_1.pickUpAll)(creep);
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        changeMode(creep, "working");
    }
    if (creep.store[RESOURCE_ENERGY] === 0) {
        changeMode(creep, "collecting");
    }
};
exports.default = behavior;
function isBuilder(creep) {
    return creep.memory.role === "builder";
}
const changeMode = (creep, mode) => {
    if (mode !== (creep.memory.mode === "harvesting" ? "collecting" : creep.memory.mode)) {
        if (mode === "working") {
            creep.say(mode);
            creep.memory.mode = mode;
        }
        else {
            creep.memory.mode = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => {
                    return ((0, util_creep_1.isStoreTarget)(s) && ![STRUCTURE_SPAWN, STRUCTURE_EXTENSION].some((t) => s.structureType === t) && s.store.getUsedCapacity(RESOURCE_ENERGY) !== 0);
                },
            }).length
                ? "collecting"
                : "harvesting";
        }
        creep.say(creep.memory.mode);
        creep.memory.buildingId = undefined;
        creep.memory.harvestTargetId = undefined;
        creep.memory.harvested = undefined;
        creep.memory.storeId = undefined;
    }
};
