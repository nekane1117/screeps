"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const behavior = (creep) => {
    var _a;
    if (!isHarvester(creep)) {
        return console.log(`${creep.name} is not Harvester`);
    }
    (0, util_creep_1.commonHarvest)(creep);
    if (!(creep.memory.storeId ||
        (creep.memory.storeId = (_a = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) => (0, util_creep_1.isStoreTarget)(s) && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
            ignoreCreeps: true,
        })) === null || _a === void 0 ? void 0 : _a.id))) {
        if (creep.memory.mode === "working") {
            (0, util_creep_1.randomWalk)(creep);
        }
    }
    else {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store) {
            const returnVal = creep.transfer(store, RESOURCE_ENERGY);
            switch (returnVal) {
                case ERR_NOT_IN_RANGE:
                    if (creep.memory.mode === "working") {
                        (0, util_creep_1.customMove)(creep, store, { range: 1 });
                    }
                    break;
                case ERR_NOT_ENOUGH_RESOURCES:
                    changeMode(creep, "harvesting");
                    break;
                case ERR_INVALID_TARGET:
                    creep.memory.storeId = undefined;
                    break;
                case ERR_FULL:
                    creep.memory.storeId = undefined;
                    break;
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
        else {
            creep.memory.storeId = undefined;
            (0, util_creep_1.randomWalk)(creep);
        }
    }
    (0, util_creep_1.stealBy)(creep, ["builder", "repairer", "upgrader"]);
    (0, util_creep_1.pickUpAll)(creep);
    if (creep.store[RESOURCE_ENERGY] === 0) {
        changeMode(creep, "harvesting");
    }
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        changeMode(creep, "working");
    }
};
exports.default = behavior;
function isHarvester(creep) {
    return creep.memory.role === "harvester";
}
function changeMode(creep, mode) {
    if (creep.memory.mode !== mode) {
        creep.say(mode);
        Object.assign(creep.memory, {
            mode,
            harvestTargetId: undefined,
            storeId: undefined,
        });
    }
}
