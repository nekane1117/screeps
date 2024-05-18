"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
function behavior(flag) {
    var _a, _b, _c, _d, _e;
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
        const spawn = flag.pos.findClosestByPath(Object.values(Game.spawns), {
            ignoreCreeps: true,
        });
        if (spawn && !spawn.spawning && spawn.room.energyAvailable > 650) {
            const { bodies, cost } = (0, util_creep_1.filterBodiesByCost)("claimer", spawn.room.energyAvailable);
            if (spawn.spawnCreep(bodies, `C_${(_a = flag.room) === null || _a === void 0 ? void 0 : _a.name}_${flag.name}`) === OK) {
                (_c = (_b = flag.room) === null || _b === void 0 ? void 0 : _b.memory.energySummary) === null || _c === void 0 ? void 0 : _c.push({
                    consumes: cost,
                    production: 0,
                    time: new Date().valueOf(),
                });
            }
        }
    }
    if (((_e = (_d = flag.room) === null || _d === void 0 ? void 0 : _d.controller) === null || _e === void 0 ? void 0 : _e.my) && flag.pos.createConstructionSite(STRUCTURE_SPAWN) === OK) {
        flag.remove();
    }
}
exports.default = behavior;
