"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
function behavior(site) {
    if (Object.values(Game.creeps).filter((c) => {
        return c.memory.role === "builder" && c.memory.baseRoom === site.pos.roomName && (c.ticksToLive || 0) > CREEP_LIFE_TIME * 0.1;
    }).length === 0) {
        const spawn = (0, utils_1.getSpawnsOrderdByRange)(site, 1).find((s) => !s.spawning && s.room.energyAvailable / s.room.energyCapacityAvailable > 0.9);
        if (spawn) {
            spawn.spawnCreep((0, util_creep_1.filterBodiesByCost)("builder", spawn.room.energyAvailable).bodies, `B_${site.pos.roomName}`, {
                memory: {
                    role: "builder",
                    baseRoom: site.pos.roomName,
                    mode: "🛒",
                },
            });
        }
    }
}
exports.default = behavior;
