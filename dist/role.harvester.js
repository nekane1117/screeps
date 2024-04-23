"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const behavior = (creep) => {
    var _a, _b;
    if (!isHarvester(creep)) {
        return console.log(`${creep.name} is not Harvester`);
    }
    // https://docs.screeps.com/simultaneous-actions.html
    // harvest
    // 対象設定処理
    if (!(creep.memory.harvestTargetId ||
        (creep.memory.harvestTargetId = (_a = creep.pos.findClosestByPath(_(creep.room.memory.activeSource)
            .map((id) => Game.getObjectById(id))
            .compact()
            .value(), {
            ignoreCreeps: true,
        })) === null || _a === void 0 ? void 0 : _a.id))) {
        // 完全に見つからなければうろうろしておく
        (0, util_creep_1.randomWalk)(creep);
    }
    else {
        // 対象が見つかった時
        const source = Game.getObjectById(creep.memory.harvestTargetId);
        if (source) {
            const returnVal = creep.harvest(source);
            switch (returnVal) {
                case ERR_NOT_IN_RANGE:
                    if (creep.memory.mode === "harvesting") {
                        // 収集モードで近くにいないときは近寄る
                        (0, util_creep_1.customMove)(creep, source);
                    }
                    break;
                // 資源がダメ系
                case ERR_NOT_ENOUGH_RESOURCES: // 空っぽ
                case ERR_INVALID_TARGET: // 対象が変
                    creep.memory.harvestTargetId = undefined;
                    break;
                // 来ないはずのやつ
                case ERR_NOT_OWNER: // 自creepじゃない
                case ERR_NOT_FOUND: // mineralは対象外
                case ERR_NO_BODYPART: // WORKが無い
                    console.log(`${creep.name} harvest returns ${util_creep_1.RETURN_CODE_DECODER[returnVal.toString()]}`);
                    creep.say(util_creep_1.RETURN_CODE_DECODER[returnVal.toString()]);
                    break;
                // 大丈夫なやつ
                case OK: // OK
                case ERR_TIRED: // 疲れた
                case ERR_BUSY: // spawning
                default:
                    break;
            }
        }
        else {
            // 指定されていたソースが見つからないとき
            // 対象をクリアしてうろうろしておく
            creep.memory.harvestTargetId = undefined;
            (0, util_creep_1.randomWalk)(creep);
        }
    }
    // transfer
    // 対象設定処理
    if (!(creep.memory.storeId ||
        (creep.memory.storeId = (_b = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: util_creep_1.isStoreTarget,
            ignoreCreeps: true,
        })) === null || _b === void 0 ? void 0 : _b.id))) {
        // 完全に見つからなければうろうろしておく
        if (creep.memory.mode === "working") {
            (0, util_creep_1.randomWalk)(creep);
        }
    }
    else {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store) {
            const returnVal = creep.transfer(store, RESOURCE_ENERGY);
            if (creep.name.endsWith("_0")) {
                console.log(`${creep.name} transfer returns ${util_creep_1.RETURN_CODE_DECODER[returnVal.toString()]}`);
            }
            switch (returnVal) {
                // 遠い
                case ERR_NOT_IN_RANGE:
                    // 分配モードの時は倉庫に近寄る
                    if (creep.memory.mode === "working") {
                        (0, util_creep_1.customMove)(creep, store);
                    }
                    break;
                // 手持ちがない
                case ERR_NOT_ENOUGH_RESOURCES: // 値を指定しないから多分発生しない
                    changeMode(creep, "harvesting");
                    break;
                // 対象が変
                case ERR_INVALID_TARGET: // 対象が変
                case ERR_FULL: // 満タン
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
            // 空っぽになったら収集モードに切り替える
            if (creep.store[RESOURCE_ENERGY] === 0) {
                changeMode(creep, "harvesting");
            }
            // 満タンだったら分配モードに切り替える
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
                changeMode(creep, "working");
            }
        }
        else {
            // 指定されていたソースが見つからないとき
            // 対象をクリアしてうろうろしておく
            creep.memory.storeId = undefined;
            (0, util_creep_1.randomWalk)(creep);
        }
    }
};
exports.default = behavior;
function isHarvester(creep) {
    return creep.memory.role === "harvester";
}
function changeMode(creep, mode) {
    Object.assign(creep.memory, {
        mode,
        harvestTargetId: undefined,
        storeId: undefined,
    });
}
