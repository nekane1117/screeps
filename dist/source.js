"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.behavior = void 0;
const util_creep_1 = require("./util.creep");
function behavior(source) {
    var _a;
    if (!Memory.sources[source.id] || Game.time % 100 === 0) {
        Memory.sources[source.id] = initMemory(source);
    }
    const memory = _.cloneDeep(Memory.sources[source.id]);
    const harvesters = _((0, util_creep_1.getCreepsInRoom)(source.room).filter((c) => {
        const isH = (c) => {
            return c.memory.role === "harvester";
        };
        return c !== undefined && isH(c) && c.memory.harvestTargetId === source.id;
    }));
    if (harvesters.size() < memory.positions && harvesters.map((c) => c.getActiveBodyparts(WORK)).sum() < 5) {
        if (source.room.energyAvailable > 200) {
            for (const n of _.range(memory.positions)) {
                const name = `H_${source.pos.x}_${source.pos.y}_${n}`;
                if (Game.creeps[name]) {
                    continue;
                }
                const spawn = _((0, util_creep_1.getSpawnsInRoom)(source.room))
                    .filter((s) => !s.spawning)
                    .first();
                if (!spawn) {
                    return ERR_NOT_FOUND;
                }
                const { bodies, cost } = (0, util_creep_1.filterBodiesByCost)("harvester", spawn.room.energyAvailable);
                const spawned = spawn.spawnCreep(bodies, name, {
                    memory: {
                        role: "harvester",
                        harvestTargetId: source.id,
                    },
                    energyStructures: _(spawn.room.find(FIND_STRUCTURES, {
                        filter: (s) => s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION,
                    }))
                        .sortBy((s) => 50 - s.pos.getRangeTo(spawn))
                        .run(),
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
    }
    const distributerName = `D_${source.pos.x}_${source.pos.y}`;
    const creeps = (0, util_creep_1.getCreepsInRoom)(source.room).filter((c) => c.name === distributerName);
    if (creeps.length === 0) {
        const spawn = _((0, util_creep_1.getSpawnsInRoom)(source.room))
            .filter((s) => !s.spawning)
            .first();
        if (!spawn) {
            return ERR_NOT_FOUND;
        }
        if (source.room.energyAvailable > 150) {
            const { bodies, cost } = (0, util_creep_1.filterBodiesByCost)("distributer", source.room.energyAvailable);
            if (spawn.spawnCreep(bodies, distributerName, {
                memory: {
                    mode: "🛒",
                    role: "distributer",
                    sourceId: source.id,
                },
            }) == OK) {
                (_a = source.room.memory.energySummary) === null || _a === void 0 ? void 0 : _a.push({
                    time: new Date().valueOf(),
                    consumes: cost,
                    production: 0,
                });
                return OK;
            }
        }
        else {
            return ERR_NOT_ENOUGH_ENERGY;
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
