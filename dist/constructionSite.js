"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
function behavior(site) {
    var _a;
    if (Object.values(Game.creeps)
        .filter((c) => c.memory.role === "builder" && (c.ticksToLive || 0) > CREEP_LIFE_TIME * 0.1)
        .filter((b) => b.memory.baseRoom === site.pos.roomName).length === 0) {
        const spawn = (0, utils_1.getSpawnsOrderdByRange)(site, 1).find((s) => !s.spawning && s.room.energyAvailable / s.room.energyCapacityAvailable > 0.9);
        if (spawn) {
            const { bodies, cost } = (0, util_creep_1.filterBodiesByCost)("builder", spawn.room.energyAvailable);
            if (spawn.spawnCreep(bodies, `B_${site.pos.roomName}`, {
                memory: {
                    role: "builder",
                    baseRoom: site.pos.roomName,
                    mode: "🛒",
                },
            }) === OK) {
                (_a = spawn.room.memory.energySummary) === null || _a === void 0 ? void 0 : _a.push({
                    consumes: cost,
                    production: 0,
                    time: new Date().valueOf(),
                });
            }
        }
    }
}
exports.default = behavior;
