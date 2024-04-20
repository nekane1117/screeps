"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const behavior = (creep) => {
    var _a;
    if (!isUpgrader(creep)) {
        return console.log(`${creep.name} is not Upgrader`);
    }
    if (!creep.room.controller) {
        return creep.suicide();
    }
    if (creep.memory.upgrading) {
        // アップグレード中の時
        switch (creep.upgradeController(creep.room.controller)) {
            case ERR_NOT_IN_RANGE:
                creep.moveTo(creep.room.controller, {
                    // 3マス以上離れてるうちはcreepを無視
                    ignoreCreeps: !creep.pos.inRangeTo(creep.room.controller, 6),
                });
                return;
            case ERR_NOT_ENOUGH_ENERGY:
                creep.memory.upgrading = false;
                return;
        }
    }
    else {
        // 資源収集モード
        // 対象が無ければ入れる
        if (!creep.memory.targetId) {
            creep.memory.targetId = (_a = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                // 複数種類のfindが出来ないのでStructureでfindしてfilterで絞る
                ignoreCreeps: true,
                filter: (s) => {
                    // StorageTargetかつエネルギーがある
                    return (0, util_creep_1.isStoreTarget)(s) && !!s.store[RESOURCE_ENERGY];
                },
            })) === null || _a === void 0 ? void 0 : _a.id;
        }
        // 対象が全くない時
        if (!creep.memory.targetId) {
            return creep.say("empty all");
        }
        const target = Game.getObjectById(creep.memory.targetId);
        if (!target) {
            return ERR_NOT_FOUND;
        }
        // 取り出してみる
        switch (creep.withdraw(target, RESOURCE_ENERGY)) {
            // 離れていた時
            case ERR_NOT_IN_RANGE:
                creep.moveTo(target, {
                    // 3マス以上離れてるうちはcreepを無視
                    ignoreCreeps: !creep.pos.inRangeTo(target, 3),
                });
                break;
            case OK: // 取れたとき
            case ERR_NOT_ENOUGH_RESOURCES: // 無いとき
            case ERR_FULL: // 満タンの時
                // 満タンになったか、空になったかのどっちかしかないので消す
                creep.memory.targetId = undefined;
        }
        // 適当に容量が8割を超えてたらアップグレードモードにする
        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) /
            creep.store.getCapacity(RESOURCE_ENERGY) >
            0.8) {
            creep.memory.upgrading = true;
            creep.memory.targetId = undefined;
        }
    }
};
exports.default = behavior;
function isUpgrader(creep) {
    return creep.memory.role === "upgrader";
}
