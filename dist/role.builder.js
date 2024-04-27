"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const behavior = (creep) => {
    var _a, _b;
    if (!isBuilder(creep)) {
        return console.log(`${creep.name} is not Builder`);
    }
    // https://docs.screeps.com/simultaneous-actions.html
    // harvest
    (0, util_creep_1.commonHarvest)(creep, {
        // 切れててもでも近寄る
        activeOnly: false,
    });
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
                    changeMode(creep, "collecting");
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
                    console.log(`${creep.name} build returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.built.toString()]}`);
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
    if (creep.memory.storeId ||
        (creep.memory.storeId = (_b = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) => {
                return (0, util_creep_1.isStoreTarget)(s) && ![STRUCTURE_SPAWN, STRUCTURE_EXTENSION].some((t) => t === s.structureType) && s.store.getUsedCapacity(RESOURCE_ENERGY) !== 0;
            },
        })) === null || _b === void 0 ? void 0 : _b.id)) {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store) {
            creep.memory.worked = creep.withdraw(store, RESOURCE_ENERGY);
            switch (creep.memory.worked) {
                case ERR_NOT_ENOUGH_RESOURCES: // 空っぽ
                case ERR_INVALID_TARGET: // 対象が変
                    creep.memory.storeId = undefined;
                    break;
                // 満タンまで取った
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
                // 有りえない系
                case ERR_NOT_OWNER:
                case ERR_INVALID_ARGS:
                    console.log(`${creep.name} build returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
                    creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]);
                    break;
                // 問題ない系
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
    // withdraw
    // 落っこちてるものを拾う
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
