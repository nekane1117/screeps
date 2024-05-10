"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.behavior = void 0;
const util_creep_1 = require("./util.creep");
function behavior(source) {
    var _a;
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
