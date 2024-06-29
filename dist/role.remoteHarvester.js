"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (creep) => {
    var _a;
    if (!isRemoteHarvester(creep)) {
        return console.log(`${creep.name} is not RemoteHarvester`);
    }
    const moveMeTo = (target, opt) => {
        return (0, util_creep_1.customMove)(creep, target, Object.assign({}, opt));
    };
    const memory = (0, utils_1.readonly)(creep.memory);
    const targetRoom = Game.rooms[memory.targetRoomName];
    if (!targetRoom) {
        return (0, util_creep_1.moveRoom)(creep, creep.pos.roomName, memory.targetRoomName);
    }
    const hostiles = creep.room.find(FIND_HOSTILE_CREEPS);
    const inverderCodre = creep.room.find(FIND_HOSTILE_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_INVADER_CORE });
    const enemy = creep.pos.findClosestByRange(_.compact([...hostiles, ...inverderCodre]));
    if (enemy) {
        const defenders = (0, util_creep_1.getCreepsInRoom)(creep.room).defender || [];
        if (defenders.length === 0) {
            const baseRoom = Game.rooms[memory.baseRoom];
            if (baseRoom && baseRoom.energyAvailable === baseRoom.energyCapacityAvailable) {
                const spawn = (0, utils_1.getSpawnsInRoom)(baseRoom).find((s) => !s.spawning);
                if (spawn) {
                    spawn.spawnCreep((0, util_creep_1.filterBodiesByCost)("defender", baseRoom.energyAvailable).bodies, `D_${creep.room.name}_${Game.time}`, {
                        memory: {
                            role: "defender",
                            baseRoom: memory.targetRoomName,
                            targetId: enemy.id,
                        },
                    });
                }
            }
        }
        creep.rangedAttack(enemy);
        creep.attack(enemy);
    }
    if (creep.memory.targetRoomName !== creep.pos.roomName) {
        creep.memory.mode = "🌾";
    }
    else if (creep.memory.mode === "🌾" && creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0 && (0, utils_1.getSitesInRoom)(creep.room).length) {
        creep.memory.mode = "👷";
    }
    else if (creep.store.energy === 0 || (0, utils_1.getSitesInRoom)(creep.room).length === 0) {
        creep.memory.mode = "🌾";
    }
    if (creep.memory.mode === "🌾") {
        creep.memory.harvestTargetId = creep.memory.harvestTargetId || ((_a = findHarvestTarget(creep, targetRoom)) === null || _a === void 0 ? void 0 : _a.id);
        const source = memory.harvestTargetId && Game.getObjectById(memory.harvestTargetId);
        if (source) {
            _((creep.memory.worked = creep.harvest(source)))
                .tap((worked) => {
                switch (worked) {
                    case ERR_NOT_IN_RANGE:
                        if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                            moveMeTo(source);
                        }
                        return;
                    case OK:
                        return;
                    case ERR_NOT_ENOUGH_ENERGY:
                    case ERR_NO_PATH:
                        creep.memory.harvestTargetId = undefined;
                        return;
                    default:
                        creep.memory.harvestTargetId = undefined;
                        creep.say(util_creep_1.RETURN_CODE_DECODER[worked.toString()].replace("ERR_", ""));
                        console.log(creep.name, "harvest", creep.saying);
                }
            })
                .run();
        }
        else {
            creep.memory.harvestTargetId = undefined;
        }
        if (source === null || source === void 0 ? void 0 : source.pos.isNearTo(creep)) {
            const site = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES, { filter: (s) => s.pos.inRangeTo(creep, 3) });
            const damaged = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: (s) => s.hits < s.hitsMax && s.pos.inRangeTo(creep, 3) });
            if (site || damaged) {
                if (site) {
                    creep.build(site);
                }
                if (damaged) {
                    creep.repair(damaged);
                }
            }
            else {
                const { container: containers } = (0, utils_1.findMyStructures)(creep.room);
                const container = source.pos.findClosestByRange([...containers, ...(0, utils_1.getSitesInRoom)(creep.room)], {
                    filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.pos.isNearTo(source),
                });
                if (container) {
                    if (!("progress" in container)) {
                        if (creep.store.energy > creep.getActiveBodyparts(WORK)) {
                            _(creep.transfer(container, RESOURCE_ENERGY))
                                .tap((result) => {
                                switch (result) {
                                    case ERR_NOT_IN_RANGE:
                                        if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
                                            moveMeTo(source);
                                        }
                                        return;
                                    case OK:
                                    case ERR_FULL:
                                    case ERR_NOT_ENOUGH_ENERGY:
                                        return OK;
                                    default:
                                        creep.say(util_creep_1.RETURN_CODE_DECODER[result.toString()].replace("ERR_", ""));
                                        console.log(creep.name, "transfer", creep.saying);
                                        break;
                                }
                            })
                                .run();
                        }
                    }
                }
                else {
                    creep.pos.createConstructionSite(STRUCTURE_CONTAINER);
                }
            }
        }
    }
    else {
        const site = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES);
        if (site && creep.build(site) === ERR_NOT_IN_RANGE) {
            moveMeTo(site);
        }
    }
    (0, util_creep_1.pickUpAll)(creep);
};
exports.default = behavior;
function isRemoteHarvester(creep) {
    return creep.memory.role === "remoteHarvester";
}
function findHarvestTarget(creep, targetRoom) {
    const sources = targetRoom.find(FIND_SOURCES);
    return (creep.pos.findClosestByPath(sources, { filter: (s) => s.energy > 0 }) ||
        _(sources)
            .sortBy((s) => s.ticksToRegeneration)
            .first());
}
