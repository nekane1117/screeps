"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const behavior = (creep) => {
    if (!isUpgrader(creep)) {
        return console.log(`${creep.name} is not Upgrader`);
    }
    if (!creep.room.controller) {
        return creep.suicide();
    }
    // https://docs.screeps.com/simultaneous-actions.html
    if (creep.memory.mode === "harvesting") {
        // harvest
        (0, util_creep_1.commonHarvest)(creep);
    }
    else {
        // upgrade
        creep.memory.worked = creep.upgradeController(creep.room.controller);
        switch (creep.memory.worked) {
            // 資源不足
            case ERR_NOT_ENOUGH_RESOURCES:
                changeMode(creep, "harvesting");
                break;
            case ERR_NOT_IN_RANGE:
                if (creep.memory.mode === "working") {
                    (0, util_creep_1.customMove)(creep, creep.room.controller);
                }
                break;
            // 有りえない系
            case ERR_NOT_OWNER:
            case ERR_INVALID_TARGET:
            case ERR_NO_BODYPART:
                console.log(`${creep.name} transfer returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
                creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]);
                break;
            // 問題ない系
            case OK:
            case ERR_BUSY:
            default:
                break;
        }
    }
    // withdraw
    // 落っこちてるものを拾う
    (0, util_creep_1.pickUpAll)(creep);
    // 通りがかりにharvesterが居たら奪い取る
    (0, util_creep_1.stealBy)(creep, ["harvester", "carrier"]);
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        changeMode(creep, "working");
    }
    if (creep.store[RESOURCE_ENERGY] === 0) {
        changeMode(creep, "harvesting");
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
        creep.memory.harvestTargetId = undefined;
        creep.memory.harvested = undefined;
    }
};
