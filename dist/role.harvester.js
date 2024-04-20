"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const behavior = (creep) => {
    if (!isHarvester(creep)) {
        return console.log(`${creep.name} is not Harvester`);
    }
    if (creep.store.getFreeCapacity() === 0) {
        // 満タンの時
        const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            // 複数種類のfindが出来ないのでStructureでfindしてfilterで絞る
            ignoreCreeps: true,
            filter: (s) => {
                // StorageTargetかつ空きがある
                return (0, util_creep_1.isStoreTarget)(s) && !!s.store.getFreeCapacity(RESOURCE_ENERGY);
            },
        });
        if (!target) {
            return;
        }
        // この辺から実際の動き
        if (creep.pos.isNearTo(target)) {
            // 隣接しているとき渡してみる
            return creep.transfer(target, RESOURCE_ENERGY);
        }
        else {
            // 離れてるときはpathに従って移動して終わる
            return creep.moveTo(target);
        }
    }
    else {
        // 空きがあるとき
        const target = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE, {
            ignoreCreeps: true,
            filter: (s) => {
                return !!_(util_creep_1.squareDiff)
                    // 8近傍の位置を取得する
                    .map(([dx, dy]) => {
                    return creep.room.getPositionAt(s.pos.x + dx, s.pos.y + dy);
                })
                    .compact()
                    // 壁以外かつcreepのいないマス
                    .filter((pos) => pos.lookFor(LOOK_TERRAIN)[0] !== "wall" &&
                    !pos.lookFor(LOOK_CREEPS).length)
                    // がある
                    .size();
            },
        });
        if (!target) {
            return creep.say("no target");
        }
        if (creep.pos.isNearTo(target)) {
            creep.harvest(target);
        }
        else {
            // 離れてるときは移動する
            return creep.moveTo(target);
        }
    }
};
exports.default = behavior;
function isHarvester(creep) {
    return creep.memory.role === "harvester";
}
