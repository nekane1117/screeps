"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
function behavior(site) {
    if (!site.room) {
        return;
    }
    const bodies = (0, util_creep_1.filterBodiesByCost)("builder", site.room.energyAvailable).bodies;
    if (Object.values(Game.creeps).filter((c) => {
        return c.memory.role === "builder" && c.memory.baseRoom === site.pos.roomName && (c.ticksToLive || 0) > bodies.length * CREEP_SPAWN_TIME;
    }).length < 1) {
        const spawn = (() => {
            var _a;
            const inRoom = _((0, utils_1.getSpawnsInRoom)(site.room));
            if (inRoom.size() > 0) {
                return inRoom.filter((s) => !s.spawning && s.room.energyAvailable === s.room.energyCapacityAvailable).first();
            }
            else {
                return (_a = (0, utils_1.getSpawnsWithDistance)(site)
                    .filter((s) => s.spawn.room.energyAvailable === s.spawn.room.energyCapacityAvailable)
                    .sortBy((r) => r.spawn.room.energyAvailable / Math.pow((r.distance + 1), 2))
                    .first()) === null || _a === void 0 ? void 0 : _a.spawn;
            }
        })();
        if (spawn) {
            spawn.spawnCreep((0, util_creep_1.filterBodiesByCost)("builder", spawn.room.energyAvailable).bodies, `B_${site.pos.roomName}_${Game.time}`, {
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
