"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
function behavior(site) {
    var _a, _b;
    const upgradeContainer = ((_a = site.room) === null || _a === void 0 ? void 0 : _a.controller) &&
        _(site.room.controller.pos.findInRange(FIND_STRUCTURES, 3, { filter: (s) => s.structureType === STRUCTURE_CONTAINER })).first();
    if (Object.values(Game.creeps).filter((c) => {
        return c.memory.role === "builder" && c.memory.baseRoom === site.pos.roomName && (c.ticksToLive || 0) > CREEP_LIFE_TIME * 0.1;
    }).length < (upgradeContainer ? (0, utils_1.getCapacityRate)(upgradeContainer) / 0.9 : 1)) {
        const spawn = (_b = (0, utils_1.getSpawnsWithDistance)(site)
            .sort((a, b) => b.spawn.room.energyAvailable / Math.pow((b.distance + 1), 2) - a.spawn.room.energyAvailable / Math.pow((a.distance + 1), 2))
            .find(({ spawn: { room: { energyAvailable, energyCapacityAvailable }, }, }) => energyAvailable / energyCapacityAvailable > 0.9)) === null || _b === void 0 ? void 0 : _b.spawn;
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
