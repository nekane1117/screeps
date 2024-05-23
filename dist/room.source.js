"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.behavior = void 0;
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
function behavior(source) {
    var _a, _b;
    if (!((_b = (_a = source.room.memory) === null || _a === void 0 ? void 0 : _a.sources) === null || _b === void 0 ? void 0 : _b[source.id]) || Game.time % 100 === 0) {
        source.room.memory.sources = source.room.memory.sources || {};
        source.room.memory.sources[source.id] = initMemory(source);
    }
    const harvesters = _(Object.values(Game.creeps).filter((c) => {
        const isH = (c) => {
            return c.memory.role === "harvester";
        };
        return c !== undefined && isH(c) && c.memory.harvestTargetId === source.id;
    }));
    if (harvesters.size() < 1 && harvesters.map((c) => c.getActiveBodyparts(WORK)).sum() < 5) {
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
function initMemory(source) {
    const terrain = source.room.getTerrain();
    return {
        positions: util_creep_1.squareDiff
            .map(([dx, dy]) => {
            return terrain.get(source.pos.x + dx, source.pos.y + dy);
        })
            .filter((terrain) => terrain !== TERRAIN_MASK_WALL).length,
    };
}
