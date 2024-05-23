"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
function behavior(flag) {
    var _a, _b, _c;
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
        const spawn = (0, utils_1.getSpawnsOrderdByRange)(flag, 1).find((s) => { var _a, _b; return (_b = (_a = Game.rooms[s.room.name]) === null || _a === void 0 ? void 0 : _a.controller) === null || _b === void 0 ? void 0 : _b.level; });
        if (spawn && !spawn.spawning && spawn.room.energyAvailable > 650) {
            const { bodies, cost } = (0, util_creep_1.filterBodiesByCost)("claimer", spawn.room.energyAvailable);
            if (spawn.spawnCreep(bodies, `C_${flag.pos.roomName}_${flag.name}`, {
                memory: {
                    role: "claimer",
                    baseRoom: spawn.room.name,
                    flagName: flag.name,
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
    if (((_c = (_b = flag.room) === null || _b === void 0 ? void 0 : _b.controller) === null || _c === void 0 ? void 0 : _c.my) && flag.pos.createConstructionSite(STRUCTURE_SPAWN) === OK) {
        flag.remove();
    }
}
exports.default = behavior;
