"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const behavior = (creep) => {
    var _a;
    if (!isHarvester(creep)) {
        return console.log(`${creep.name} is not Harvester`);
    }
    // https://docs.screeps.com/simultaneous-actions.html
    // harvest
    (0, util_creep_1.commonHarvest)(creep);
    //withdraw
    // 通りがかりに落っこちてるリソースを拾う
    creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1).forEach((resource) => {
        creep.pickup(resource);
    });
    // 通りがかりの墓から拾う
    creep.pos.findInRange(FIND_TOMBSTONES, 1).forEach((tombstone) => {
        creep.withdraw(tombstone, RESOURCE_ENERGY);
    });
    // transfer
    // 対象設定処理
    if (!(creep.memory.storeId ||
        (creep.memory.storeId = (_a = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: util_creep_1.isStoreTarget,
            ignoreCreeps: true,
        })) === null || _a === void 0 ? void 0 : _a.id))) {
        // 完全に見つからなければうろうろしておく
        if (creep.memory.mode === "working") {
            (0, util_creep_1.randomWalk)(creep);
        }
    }
    else {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store) {
            const returnVal = creep.transfer(store, RESOURCE_ENERGY);
            switch (returnVal) {
                // 遠い
                case ERR_NOT_IN_RANGE:
                    // 分配モードの時は倉庫に近寄る
                    if (creep.memory.mode === "working") {
                        (0, util_creep_1.customMove)(creep, store, { range: 1 });
                    }
                    break;
                // 手持ちがない
                case ERR_NOT_ENOUGH_RESOURCES: // 値を指定しないから多分発生しない
                    changeMode(creep, "harvesting");
                    break;
                // 対象が変
                case ERR_INVALID_TARGET: // 対象が変
                    creep.memory.storeId = undefined;
                    break;
                case ERR_FULL: // 満タン
                    (0, util_creep_1.randomWalk)(creep);
                    creep.memory.storeId = undefined;
                    break;
                // 有りえない系
                case ERR_NOT_OWNER: // 自creepじゃない
                case ERR_INVALID_ARGS: // 引数が変
                    console.log(`${creep.name} transfer returns ${util_creep_1.RETURN_CODE_DECODER[returnVal.toString()]}`);
                    creep.say(util_creep_1.RETURN_CODE_DECODER[returnVal.toString()]);
                    break;
                // 問題ない系
                case OK:
                case ERR_BUSY: // spawining
                default:
                    break;
            }
        }
        else {
            // 指定されていたソースが見つからないとき
            // 対象をクリアしてうろうろしておく
            creep.memory.storeId = undefined;
            (0, util_creep_1.randomWalk)(creep);
        }
    }
    // 空っぽになったら収集モードに切り替える
    if (creep.store[RESOURCE_ENERGY] === 0) {
        changeMode(creep, "harvesting");
    }
    // 満タンだったら分配モードに切り替える
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
        Object.assign(creep.memory, {
            mode,
            harvestTargetId: undefined,
            storeId: undefined,
        });
    }
}
