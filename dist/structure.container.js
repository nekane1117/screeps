"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
function containerBehavior(structure) {
    var _a, _b;
    // 取れないやつが来た時は消して終了
    if (!isTarget(structure)) {
        return console.log(`${structure.id} is not container(${structure.structureType})`);
    }
    // 自分用のメモリを初期化する
    if (!structure.room.memory.containers[structure.id] || !((_a = structure.room.memory.containers[structure.id]) === null || _a === void 0 ? void 0 : _a.carrierName)) {
        structure.room.memory.containers[structure.id] = {
            carrierName: `C_${structure.pos.x.toString().padStart(2, "0")}_${structure.pos.y.toString().padStart(2, "0")}`,
        };
    }
    const carrierName = (_b = structure.room.memory.containers[structure.id]) === null || _b === void 0 ? void 0 : _b.carrierName;
    if (carrierName) {
        // Creepが無ければSpawnを探す
        if (!Game.creeps[carrierName]) {
            const spawn = structure.room
                .find(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_SPAWN,
            })
                .find((spawn) => !spawn.spawning);
            // 使えるSpawnがあったときは作る
            if (spawn && spawn.room.energyAvailable > spawn.room.energyCapacityAvailable * 0.5) {
                spawn.spawnCreep((0, util_creep_1.bodyMaker)("carrier", spawn.room.energyAvailable), carrierName, {
                    memory: {
                        role: "carrier",
                        storeId: structure.id,
                    },
                });
            }
        }
    }
    else {
        // メモリが見つからなければ終了
        return;
    }
}
exports.default = containerBehavior;
function isTarget(s) {
    return s.structureType === STRUCTURE_CONTAINER;
}
