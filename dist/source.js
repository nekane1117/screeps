"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const utils_1 = require("./utils");
function behavior(source) {
    var _a;
    if (Object.values(Game.constructionSites).length === 0) {
    }
    const harvesters = _(Object.values(Game.creeps))
        .filter((c) => {
        const isHarvester = (c) => {
            return c.memory.role === "harvester";
        };
        return isHarvester(c) && c.memory.harvestTargetId === source.id;
    })
        .run();
    const works = _(harvesters)
        .map((h) => h.getActiveBodyparts(WORK))
        .sum();
    if (harvesters.length < source.room.memory.sources[source.id].spaces &&
        ((works === 0 && source.room.energyAvailable > 200) || (source.room.energyAvailable / source.room.energyCapacityAvailable > 0.8 && works < 5))) {
        (_a = Object.values(Game.spawns)
            .find((spawn) => spawn.room.name === source.room.name && !spawn.spawning)) === null || _a === void 0 ? void 0 : _a.spawnCreep((0, utils_1.getBodyByCost)(constants_1.BODY.harvester, source.room.energyAvailable), ["H", source.pos.x, source.pos.y, Game.time.toString()].join("_"), {
            memory: {
                role: "harvester",
                harvestTargetId: source.id,
            },
        });
    }
}
exports.default = behavior;
