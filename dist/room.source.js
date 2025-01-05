"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.behavior = behavior;
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
function behavior(source) {
    const harvesters = (0, util_creep_1.getCreepsInRoom)(source.room).harvester || [];
    const myH = harvesters.filter((h) => { var _a; return ((_a = h.memory) === null || _a === void 0 ? void 0 : _a.harvestTargetId) === source.id; });
    if (myH.length < 1) {
        const spawn = (() => {
            const spawns = (0, utils_1.getSpawnsInRoom)(source.room);
            if (spawns.length > 0) {
                return source.pos.findClosestByRange(spawns.filter((s) => !s.spawning));
            }
            else {
                return _(Object.values(Game.spawns))
                    .map((spawn) => {
                    return {
                        spawn,
                        cost: PathFinder.search(source.pos, spawn.pos).cost,
                    };
                })
                    .min((v) => v.cost).spawn;
            }
        })();
        if (!spawn) {
            console.log(`source ${source.id} can't find spawn`);
            return ERR_NOT_FOUND;
        }
        if (harvesters.length > 0 ? spawn.room.energyAvailable >= spawn.room.energyCapacityAvailable : spawn.room.energyAvailable >= 300) {
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
    else if (myH.length > 1) {
        _(myH)
            .sortBy((c) => c.ticksToLive || Infinity)
            .reverse()
            .tail()
            .forEach((c) => c.suicide())
            .run();
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
