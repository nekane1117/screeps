"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
function containerBehavior(structure) {
    if (!isTarget(structure)) {
        return console.log(`${structure.id} is not container(${structure.structureType})`);
    }
    return _.range(structure.store.getUsedCapacity(RESOURCE_ENERGY) / structure.store.getCapacity(RESOURCE_ENERGY) > 0.5 ? 3 : 1).map((n) => {
        const carrierName = `C_${structure.pos.x}_${structure.pos.y}_${n}`;
        if (!Game.creeps[carrierName]) {
            const spawn = structure.room
                .find(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_SPAWN,
            })
                .find((spawn) => !spawn.spawning);
            if (spawn && spawn.room.energyAvailable > spawn.room.energyCapacityAvailable * 0.6) {
                return spawn.spawnCreep((0, util_creep_1.bodyMaker)("carrier", spawn.room.energyAvailable), carrierName, {
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
