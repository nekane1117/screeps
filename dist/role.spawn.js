"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const util_creep_1 = require("./util.creep");
const behavior = (spawn) => {
    var _a;
    if (((_a = Object.keys(Game.spawns)) === null || _a === void 0 ? void 0 : _a[0]) === spawn.name) {
        spawn.room.visual.text(`${spawn.room.energyAvailable}/${spawn.room.energyCapacityAvailable}`, spawn.pos.x + 1, spawn.pos.y - 1);
    }
    if (spawn.spawning) {
        return;
    }
    const creepsInRoom = (0, lodash_1.default)((0, util_creep_1.getCreepsInRoom)(spawn.room))
        .groupBy((c) => c.memory.role)
        .value();
    const sitesInRoom = Object.values(Game.constructionSites).filter((s) => { var _a; return ((_a = s.room) === null || _a === void 0 ? void 0 : _a.name) === spawn.room.name; });
    if (sitesInRoom.length === 0 &&
        (creepsInRoom.upgrader || []).length === 0 &&
        spawn.room.energyAvailable > Math.max(200, spawn.room.energyCapacityAvailable * 0.8)) {
        const { bodies, cost } = (0, util_creep_1.filterBodiesByCost)("upgrader", spawn.room.energyAvailable);
        const spawned = spawn.spawnCreep(bodies, `U_${Game.time}`, {
            memory: {
                role: "upgrader",
            },
        });
        if (spawned === OK && spawn.room.memory.energySummary) {
            spawn.room.memory.energySummary.push({
                time: new Date().valueOf(),
                consumes: cost,
                production: 0,
            });
        }
        return spawned;
    }
    return OK;
};
exports.default = behavior;
