"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.behavior = void 0;
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
function behavior(source) {
    const harvesters = Object.values(Game.creeps).filter((c) => {
        return isH(c) && c.memory.harvestTargetId === source.id && ((c === null || c === void 0 ? void 0 : c.ticksToLive) || 0) > (0, util_creep_1.filterBodiesByCost)("harvester", 10000).bodies.length * CREEP_SPAWN_TIME;
    });
    if (harvesters.length < 1 &&
        _(harvesters)
            .map((h) => h.getActiveBodyparts(WORK))
            .flatten()
            .sum() < 5) {
        const spawn = (() => {
            const spawns = (0, utils_1.getSpawnsInRoom)(source.room);
            if (spawns.length > 0) {
                return source.pos.findClosestByRange(spawns);
            }
            else {
                return source.pos.findClosestByPath(Object.values(Game.spawns));
            }
        })();
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
