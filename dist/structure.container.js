"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
function containerBehavior(structure) {
    if (!isTarget(structure)) {
        return console.log(`${structure.id} is not container(${structure.structureType})`);
    }
    const clothestSpawn = structure.pos.findClosestByRange(Object.values(Game.spawns));
    if (clothestSpawn) {
        return _.range(1).map((n) => {
            const carrierName = `C_${structure.pos.x}_${structure.pos.y}_${n}`;
            if (!Game.creeps[carrierName]) {
                const spawn = structure.room
                    .find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_SPAWN,
                })
                    .find((spawn) => !spawn.spawning);
                if (spawn && spawn.room.energyAvailable > spawn.room.energyCapacityAvailable * 0.6) {
                    const { bodies, cost } = (0, util_creep_1.filterBodiesByCost)("carrier", spawn.room.energyAvailable);
                    const spawned = spawn.spawnCreep(bodies, carrierName, {
                        memory: {
                            role: "carrier",
                            storeId: structure.id,
                        },
                        energyStructures: _(structure.room.find(FIND_STRUCTURES, {
                            filter: (s) => s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION,
                        }))
                            .sortBy((s) => s.pos.getRangeTo(spawn))
                            .reverse()
                            .run(),
                    });
                    if (spawned === OK && spawn.room.memory.energySummary) {
                        spawn.room.memory.energySummary.push({
                            consumes: cost,
                            production: 0,
                        });
                    }
                    return spawned;
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
}
exports.default = containerBehavior;
function isTarget(s) {
    return [STRUCTURE_CONTAINER, STRUCTURE_STORAGE].includes(s.structureType);
}
