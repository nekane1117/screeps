"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const behavior = (creep) => {
    var _a, _b;
    if (!isRepairer(creep)) {
        return console.log(`${creep.name} is not Repairer`);
    }
    // https://docs.screeps.com/simultaneous-actions.html
    // harvest
    (0, util_creep_1.commonHarvest)(creep);
    // repair
    if (creep.memory.workTargetId ||
        (creep.memory.workTargetId = (_a = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) => s.hits < s.hitsMax,
            ignoreCreeps: true,
        })) === null || _a === void 0 ? void 0 : _a.id)) {
        const target = Game.getObjectById(creep.memory.workTargetId);
        if (target && target.hits < target.hitsMax) {
            creep.memory.worked = creep.repair(target);
            switch (creep.memory.worked) {
                // 資源不足
                case ERR_NOT_ENOUGH_RESOURCES:
                    changeMode(creep, "collecting");
                    break;
                case ERR_NOT_IN_RANGE:
                    if (creep.memory.mode === "working") {
                        (0, util_creep_1.customMove)(creep, target);
                    }
                    break;
                // 有りえない系
                case ERR_NOT_OWNER:
                case ERR_NO_BODYPART:
                case ERR_INVALID_TARGET:
                    console.log(`${creep.name} repair returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
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
            // 指定されていたソースが見つからないとき
            // 対象をクリアしてうろうろしておく
            creep.memory.workTargetId = undefined;
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
            creep.memory.collected = creep.withdraw(store, RESOURCE_ENERGY);
            switch (creep.memory.collected) {
                case ERR_NOT_ENOUGH_RESOURCES: // 空っぽ
                    changeMode(creep, "collecting");
                    break;
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
                        console.log(`${creep.name} ${util_creep_1.RETURN_CODE_DECODER[moved.toString()]}`);
                        moved !== OK && creep.say(util_creep_1.RETURN_CODE_DECODER[moved.toString()]);
                    }
                    break;
                // 有りえない系
                case ERR_NOT_OWNER:
                case ERR_INVALID_ARGS:
                    console.log(`${creep.name} build returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.collected.toString()]}`);
                    creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.collected.toString()]);
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
    // 通りがかりから奪い取る
    (0, util_creep_1.stealBy)(creep, ["harvester", "carrier", "upgrader"]);
    // 落っこちてるものを拾う
    (0, util_creep_1.pickUpAll)(creep);
    // 空っぽになったら収集モードに切り替える
    if (creep.store[RESOURCE_ENERGY] === 0) {
        changeMode(creep, "collecting");
    }
    // 満タンだったら分配モードに切り替える
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        changeMode(creep, "working");
    }
};
exports.default = behavior;
function isRepairer(creep) {
    return creep.memory.role === "repairer";
}
function changeMode(creep, mode) {
    if (creep.memory.mode !== mode) {
        creep.say(mode);
        if (mode === "working") {
            creep.memory.mode = mode;
        }
        else {
            creep.memory.mode = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => {
                    return (0, util_creep_1.isStoreTarget)(s) && s.store.getUsedCapacity(RESOURCE_ENERGY) !== 0;
                },
            })
                ? "collecting"
                : "harvesting";
        }
        creep.memory.workTargetId = undefined;
    }
}