"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.containerBehavior = void 0;
const util_creep_1 = require("./util.creep");
function containerBehavior(containerId) {
    var _a;
    const container = Game.getObjectById(containerId);
    // 取れないやつが来た時は消して終了
    if (!container) {
        Object.values(Game.rooms).forEach((room) => {
            delete room.memory.containers[containerId];
        });
        return console.log(`Clearing non-existing container memory: ${Game.rooms} ${containerId}`);
    }
    if (!container.room.memory.containers[containerId] || !((_a = container.room.memory.containers[containerId]) === null || _a === void 0 ? void 0 : _a.carrierName)) {
        container.room.memory.containers[containerId] = {
            carrierName: `C_${container.pos.x.toString().padStart(2, "0")}_${container.pos.y.toString().padStart(2, "0")}`,
        };
    }
    const carrierName = container.room.memory.containers[containerId].carrierName;
    if (carrierName) {
        // Creepが無ければSpawnを探す
        if (!Game.creeps[carrierName]) {
            const spawn = container.room
                .find(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_SPAWN,
            })
                .find((spawn) => !spawn.spawning);
            // 使えるSpawnがあったときは作る
            if (spawn && spawn.room.energyAvailable > spawn.room.energyCapacityAvailable * 0.5) {
                spawn.spawnCreep((0, util_creep_1.bodyMaker)("carrier", spawn.room.energyAvailable), carrierName, {
                    memory: {
                        role: "carrier",
                        storeId: containerId,
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
exports.containerBehavior = containerBehavior;
