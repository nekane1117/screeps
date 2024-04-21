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
            creep.say("all container is full");
            return (0, util_creep_1.randomWalk)(creep);
        }
        // この辺から実際の動き
        if (creep.pos.isNearTo(target)) {
            // 隣接しているとき渡してみる
            return creep.transfer(target, RESOURCE_ENERGY);
        }
        else {
            // 離れてるときはpathに従って移動して終わる
            return (0, util_creep_1.customMove)(creep, target);
        }
    }
    else {
        return (0, util_creep_1.commonHarvest)(creep);
    }
};
exports.default = behavior;
function isHarvester(creep) {
    return creep.memory.role === "harvester";
}
