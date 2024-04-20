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
            return creep.moveTo(target, { ignoreCreeps: true });
        }
    }
    else {
        // 空きがあるとき
        if (!creep.memory.target) {
            creep.memory.target = creep.room.memory.activeSource[0];
        }
        const sources = Game.getObjectById(creep.memory.target);
        if (!sources) {
            return ERR_NOT_FOUND;
        }
        if (creep.pos.isNearTo(sources)) {
            const returnVal = creep.harvest(sources);
            if (returnVal !== OK) {
                creep.memory.target = undefined;
            }
            return returnVal;
        }
        else {
            // 離れてるときは移動する
            const returnVal = creep.moveTo(sources, {
                // 3マスより離れているときはcreepを無視する
                ignoreCreeps: !creep.pos.inRangeTo(sources, 3),
            });
            if (returnVal !== OK) {
                creep.memory.target = undefined;
            }
            return returnVal;
        }
    }
};
exports.default = behavior;
function isHarvester(creep) {
    return creep.memory.role === "harvester";
}
