"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.behavior = void 0;
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
function behavior(source) {
    var _a;
    const positions = util_creep_1.squareDiff.filter(([x, y]) => {
        var _a;
        return (_a = source.room
            .getPositionAt(source.pos.x + x, source.pos.y + y)) === null || _a === void 0 ? void 0 : _a.lookFor(LOOK_TERRAIN).find((t) => t !== "wall");
    }).length;
    const harvesters = Object.values(Game.creeps).filter((c) => {
        return isH(c) && c.memory.harvestTargetId === source.id && ((c === null || c === void 0 ? void 0 : c.ticksToLive) || 0) > (0, util_creep_1.filterBodiesByCost)("harvester", 10000).bodies.length * CREEP_SPAWN_TIME;
    });
    if (harvesters.length < positions &&
        _(harvesters)
            .map((h) => h.getActiveBodyparts(WORK))
            .flatten()
            .sum() < 5) {
        const spawn = (_a = (0, utils_1.getSpawnsWithDistance)(source)
            .sort((a, b) => {
            const evaluation = (v) => {
                return v.spawn.room.energyAvailable / Math.pow((v.distance + 1), 2);
            };
            return evaluation(b) - evaluation(a);
        })
            .first()) === null || _a === void 0 ? void 0 : _a.spawn;
        if (!spawn) {
            console.log(`source ${source.id} can't find spawn`);
            return ERR_NOT_FOUND;
        }
        if (spawn.room.energyAvailable >= 300) {
            const name = `H_${source.room.name}_${Game.time}`;
            const spawned = spawn.spawnCreep((0, util_creep_1.filterBodiesByCost)("harvester", spawn.room.energyAvailable).bodies, name, {
                memory: {
                    role: "harvester",
                    baseRoom: source.room.name,
                    harvestTargetId: source.id,
                },
            });
            return spawned;
        }
    }
    if (source.pos.findInRange([
        ...(0, utils_1.findMyStructures)(source.room).container,
        ...Object.values(Game.constructionSites).filter((s) => s.pos.roomName === source.pos.roomName && s.structureType === STRUCTURE_CONTAINER),
    ], 1).length === 0) {
        const spawn = (0, util_creep_1.getMainSpawn)(source.room);
        if (spawn) {
            const pos = _(source.pos.findPathTo(spawn, {
                ignoreCreeps: true,
            })).first();
            pos && source.room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER);
        }
    }
    return OK;
}
exports.behavior = behavior;
function isH(c) {
    return c.memory.role === "harvester";
}
