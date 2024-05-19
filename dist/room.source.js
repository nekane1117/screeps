"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.behavior = void 0;
const util_creep_1 = require("./util.creep");
function behavior(source) {
    var _a, _b;
    if (!((_b = (_a = source.room.memory) === null || _a === void 0 ? void 0 : _a.sources) === null || _b === void 0 ? void 0 : _b[source.id]) || Game.time % 100 === 0) {
        source.room.memory.sources = source.room.memory.sources || {};
        source.room.memory.sources[source.id] = initMemory(source);
    }
    const memory = _.cloneDeep(source.room.memory.sources[source.id]);
    const harvesters = _((0, util_creep_1.getCreepsInRoom)(source.room).filter((c) => {
        const isH = (c) => {
            return c.memory.role === "harvester";
        };
        return c !== undefined && isH(c) && c.memory.harvestTargetId === source.id;
    }));
    if (harvesters.size() < memory.positions && harvesters.map((c) => c.getActiveBodyparts(WORK)).sum() < 5) {
        if (source.room.energyAvailable > 200) {
            for (const n of _.range(memory.positions)) {
                const name = `H_${source.id}_${n}`;
                if (Game.creeps[name]) {
                    continue;
                }
                const spawn = (0, util_creep_1.getMainSpawn)(source.room);
                if (!spawn) {
                    return ERR_NOT_FOUND;
                }
                const { bodies, cost } = (0, util_creep_1.filterBodiesByCost)("harvester", spawn.room.energyAvailable);
                const spawned = spawn.spawnCreep(bodies, name, {
                    memory: {
                        role: "harvester",
                        baseRoom: spawn.room.name,
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
