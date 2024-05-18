"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
function behavior(flag) {
    var _a, _b, _c, _d;
    if (flag.color !== COLOR_RED) {
        console.log(`${flag.name} is not red`);
        return ERR_INVALID_ARGS;
    }
    if (!Object.values(Game.creeps).find((c) => {
        const isC = (c) => {
            return c.memory.role === "claimer";
        };
        return isC(c) && c.memory.flagName === flag.name;
    }) &&
        Object.values(Game.constructionSites).length === 0) {
        const spawn = _(Object.values(Game.spawns))
            .sort((s) => Game.map.getRoomLinearDistance(flag.pos.roomName, s.pos.roomName))
            .first();
        if (spawn && !spawn.spawning && spawn.room.energyAvailable > 650) {
            const { bodies, cost } = (0, util_creep_1.filterBodiesByCost)("claimer", spawn.room.energyAvailable);
            if (spawn.spawnCreep(bodies, `C_${flag.pos.roomName}_${flag.name}`, {
                memory: {
                    role: "claimer",
                    flagName: flag.name,
                },
            }) === OK) {
                (_b = (_a = flag.room) === null || _a === void 0 ? void 0 : _a.memory.energySummary) === null || _b === void 0 ? void 0 : _b.push({
                    consumes: cost,
                    production: 0,
                    time: new Date().valueOf(),
                });
            }
        }
    }
    if (((_d = (_c = flag.room) === null || _c === void 0 ? void 0 : _c.controller) === null || _d === void 0 ? void 0 : _d.my) && flag.pos.createConstructionSite(STRUCTURE_SPAWN) === OK) {
        flag.remove();
    }
}
exports.default = behavior;
