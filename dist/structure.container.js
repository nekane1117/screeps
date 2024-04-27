"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
function containerBehavior(structure) {
    // 取れないやつが来た時は消して終了
    if (!isTarget(structure)) {
        return console.log(`${structure.id} is not container(${structure.structureType})`);
    }
    // 自分用のメモリを初期化する
    const memory = Memory.storages[structure.id] || (Memory.storages[structure.id] = { carrierRequests: 1 });
    if (Game.time % 100 === 0) {
        if (structure.store.getUsedCapacity() / structure.store.getCapacity() < 0.25 && memory.carrierRequests > 1) {
            // 25%を切ったときはキャリアを減らす
            --memory.carrierRequests;
        }
        else if (structure.store.getUsedCapacity() / structure.store.getCapacity() < 0.75) {
            // 75%を上回ったときはキャリアを増やす
            memory.carrierRequests = Math.min(memory.carrierRequests + 1, 3);
        }
    }
    // 要求数に応じてキャリアを作る(わざわざ処分はしない)
    return _.range(memory.carrierRequests)
        .map((n) => `C_${structure.pos.x}_${structure.pos.y}_${n}`)
        .map((name) => {
        // Creepが無ければSpawnを探す
        if (!Game.creeps[name]) {
            const spawn = structure.room
                .find(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_SPAWN,
            })
                .find((spawn) => !spawn.spawning);
            // 使えるSpawnがあったときは作る
            if (spawn && spawn.room.energyAvailable > spawn.room.energyCapacityAvailable * 0.5) {
                return spawn.spawnCreep((0, util_creep_1.bodyMaker)("carrier", spawn.room.energyAvailable), name, {
                    memory: {
                        role: "carrier",
                        storeId: structure.id,
                    },
                });
            }
            else {
                return ERR_NOT_FOUND;
            }
        }
        else {
            return OK;
        }
    });
}
exports.default = containerBehavior;
function isTarget(s) {
    return s.structureType === STRUCTURE_CONTAINER;
}
