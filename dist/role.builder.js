"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const behavior = (creep) => {
    var _a;
    if (!isBuilder(creep)) {
        return console.log(`${creep.name} is not Builder`);
    }
    // https://docs.screeps.com/simultaneous-actions.html
    // harvest
    (0, util_creep_1.commonHarvest)(creep);
    // build
    if (!(creep.memory.buildingId || (creep.memory.buildingId = (_a = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES, { ignoreCreeps: true })) === null || _a === void 0 ? void 0 : _a.id))) {
        // 完全に見つからなければうろうろしておく
        (0, util_creep_1.randomWalk)(creep);
    }
    else {
        const site = Game.getObjectById(creep.memory.buildingId);
        if (site) {
            switch ((creep.memory.built = creep.build(site))) {
                case ERR_NOT_ENOUGH_RESOURCES:
                    // 手持ちが足らないときは収集モードに切り替える
                    changeMode(creep, "harvesting");
                    break;
                // 対象が変な時はクリアする
                case ERR_INVALID_TARGET:
                    creep.memory.buildingId = undefined;
                    break;
                // 建築モードで離れてるときは近寄る
                case ERR_NOT_IN_RANGE:
                    if (creep.memory.mode === "working") {
                        (0, util_creep_1.customMove)(creep, site);
                    }
                    break;
                // 有りえない系
                case ERR_NOT_OWNER: // 自creepじゃない
                case ERR_NO_BODYPART:
                    console.log(`${creep.name} transfer returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.built.toString()]}`);
                    creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.built.toString()]);
                    break;
                // 問題ない系
                case OK:
                case ERR_BUSY:
                default:
                    break;
            }
        }
        else {
            // 指定されていたソースが見つからないとき
            // 対象をクリアしてうろうろしておく
            creep.memory.buildingId = undefined;
            (0, util_creep_1.randomWalk)(creep);
        }
    }
    // withdraw
    // 落っこちてるものを拾う
    (0, util_creep_1.pickUpAll)(creep);
    // 通りがかりにharvesterが居たら奪い取る
    creep.pos.findInRange(FIND_MY_CREEPS, 1, { filter: (c) => c.memory.role === "harvester" }).forEach((c) => {
        c.transfer(creep, RESOURCE_ENERGY);
    });
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        changeMode(creep, "working");
    }
    if (creep.store[RESOURCE_ENERGY] === 0) {
        changeMode(creep, "harvesting");
    }
};
exports.default = behavior;
function isBuilder(creep) {
    return creep.memory.role === "builder";
}
const changeMode = (creep, mode) => {
    if (mode !== creep.memory.mode) {
        creep.say(mode);
        creep.memory.mode = mode;
        creep.memory.buildingId = undefined;
        creep.memory.harvestTargetId = undefined;
        creep.memory.harvested = undefined;
    }
};
