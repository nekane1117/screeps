"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.behavior = void 0;
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
function behavior(source) {
    if (!Object.values(Game.creeps).find((c) => isH(c) && c.memory.harvestTargetId === source.id)) {
        const spawn = (0, utils_1.getSpawnsOrderdByRange)(source, 1).first();
        if (!spawn) {
            console.log(`source ${source.id} can't find spawn`);
            return ERR_NOT_FOUND;
        }
        if (spawn.room.energyAvailable > 200) {
            const name = `H_${source.room.name}_${Game.time}`;
            const { bodies, cost } = (0, util_creep_1.filterBodiesByCost)("harvester", spawn.room.energyAvailable);
            const spawned = spawn.spawnCreep(bodies, name, {
                memory: {
                    role: "harvester",
                    baseRoom: source.room.name,
                    harvestTargetId: source.id,
                },
            });
            if (spawned === OK && source.room.memory.energySummary) {
                source.room.memory.energySummary.push({
                    time: Game.time,
                    consumes: cost,
                    production: 0,
                });
            }
            return spawned;
        }
    }
    return OK;
}
exports.behavior = behavior;
function isH(c) {
    return c.memory.role === "harvester";
}
