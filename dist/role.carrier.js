"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const behavior = (creep) => {
    var _a;
    if (!isCarrier(creep)) {
        return console.log(`${creep.name} is not Harvester`);
    }
    // https://docs.screeps.com/simultaneous-actions.html
    // withdraw
    const store = Game.getObjectById(creep.memory.storeId);
    if (store) {
        // 取得しようとしてみる
        creep.memory.worked = creep.withdraw(store, RESOURCE_ENERGY);
        switch (creep.memory.worked) {
            // 空の時
            case ERR_NOT_ENOUGH_RESOURCES:
                // 邪魔になるときがあるのでうろうろしておく
                (0, util_creep_1.randomWalk)(creep);
                break;
            // お腹いっぱい
            case ERR_FULL:
                changeMode(creep, "working");
                break;
            case ERR_NOT_IN_RANGE:
                if (creep.memory.mode === "collecting") {
                    (0, util_creep_1.customMove)(creep, store);
                }
                break;
            // 有りえない系
            case ERR_NOT_OWNER:
            case ERR_INVALID_TARGET:
            case ERR_INVALID_ARGS:
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
    else {
        const spawn = _((0, util_creep_1.getSpawnNamesInRoom)(creep.room))
            .map((name) => Game.spawns[name])
            .compact()
            .first();
        if (spawn) {
            if (creep.pos.isNearTo(spawn)) {
                // Spawnまでたどり着いたら処分
                creep.suicide();
            }
            else {
                creep.moveTo(spawn);
            }
        }
        else {
            // Spawnも見つからなければ処分
            creep.suicide();
        }
    }
    // transfer
    // 対象設定処理
    if (!(creep.memory.transferId ||
        (creep.memory.transferId = (_a = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) => {
                // 空きのあるSpawnから一番近いストレージ
                return ([STRUCTURE_SPAWN, STRUCTURE_EXTENSION].some((t) => t === s.structureType) &&
                    s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            },
            ignoreCreeps: true,
        })) === null || _a === void 0 ? void 0 : _a.id))) {
        // 完全に見つからなければうろうろしておく
        if (creep.memory.mode === "working") {
            (0, util_creep_1.randomWalk)(creep);
        }
    }
    else {
        const store = Game.getObjectById(creep.memory.transferId);
        if (store) {
            const returnVal = creep.transfer(store, RESOURCE_ENERGY);
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
                    changeMode(creep, "collecting");
                    break;
                // 対象が変
                case ERR_INVALID_TARGET: // 対象が変
                case ERR_FULL: // 満タン
                    creep.memory.transferId = undefined;
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
            creep.memory.transferId = undefined;
            (0, util_creep_1.randomWalk)(creep);
        }
    }
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
function isCarrier(creep) {
    return creep.memory.role === "carrier";
}
function changeMode(creep, mode) {
    if (creep.memory.mode !== mode) {
        creep.say(mode);
        creep.memory.mode = mode;
        creep.memory.transferId = undefined;
    }
}
