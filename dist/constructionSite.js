"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
function behavior(site) {
    var _a;
    if (Object.values(Game.creeps).filter((c) => {
        return c.memory.role === "builder" && c.memory.baseRoom === site.pos.roomName && (c.ticksToLive || 0) > CREEP_LIFE_TIME * 0.1;
    }).length === 0) {
        const spawn = (_a = (0, utils_1.getSpawnsWithDistance)(site)
            .sort((a, b) => b.spawn.room.energyAvailable / (a.distance + 1) - a.spawn.room.energyAvailable / (a.distance + 1))
            .find(({ spawn: { room: { energyAvailable, energyCapacityAvailable }, }, }) => energyAvailable / energyCapacityAvailable > 0.9)) === null || _a === void 0 ? void 0 : _a.spawn;
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
