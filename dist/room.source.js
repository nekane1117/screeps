"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.behavior = void 0;
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
function behavior(source) {
    if (!Object.values(Game.creeps).find((c) => isH(c) && c.memory.harvestTargetId === source.id)) {
        const spawn = (0, utils_1.getSpawnsOrderdByRange)(source, 1).first() || (0, utils_1.getSpawnsOrderdByRange)(source).first();
        if (!spawn) {
            console.log(`source ${source.id} can't find spawn`);
            return ERR_NOT_FOUND;
        }
        if (spawn.room.energyAvailable > 200) {
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
