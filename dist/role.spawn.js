"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (spawn) => {
    var _a, _b;
    if (((_a = Object.keys(Game.spawns)) === null || _a === void 0 ? void 0 : _a[0]) === spawn.name) {
        spawn.room.visual.text(`${spawn.room.energyAvailable}/${spawn.room.energyCapacityAvailable}`, spawn.pos.x + 1, spawn.pos.y - 1);
    }
    if (spawn.spawning) {
        return;
    }
    const creepsInRoom = (0, lodash_1.default)((0, util_creep_1.getCreepsInRoom)(spawn.room))
        .groupBy((c) => c.memory.role)
        .value();
    if (spawn.room.energyAvailable >= 300) {
        for (const source of spawn.room.find(FIND_SOURCES)) {
            const terrain = spawn.room.getTerrain();
            const maxCount = (0, lodash_1.default)(util_creep_1.squareDiff)
                .map(([dx, dy]) => {
                return terrain.get(source.pos.x + dx, source.pos.y + dy) !== TERRAIN_MASK_WALL ? 1 : 0;
            })
                .sum();
            const harvesters = (0, lodash_1.default)((0, util_creep_1.getCreepsInRoom)(spawn.room).filter((c) => {
                const isH = (c) => {
                    return c.memory.role === "harvester";
                };
                return c !== undefined && isH(c) && c.memory.harvestTargetId === source.id;
            }));
            if (harvesters.size() < maxCount && harvesters.map((c) => c.getActiveBodyparts(WORK)).sum() < 5) {
                const { bodies, cost } = (0, util_creep_1.filterBodiesByCost)("harvester", spawn.room.energyAvailable);
                const spawned = spawn.spawnCreep(bodies, generateCreepName("harvester"), {
                    memory: {
                        role: "harvester",
                        harvestTargetId: source.id,
                    },
                    energyStructures: (0, lodash_1.default)(spawn.room.find(FIND_STRUCTURES, {
                        filter: (s) => s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION,
                    }))
                        .sortBy((s) => s.pos.getRangeTo(spawn))
                        .reverse()
                        .run(),
                });
                if (spawned === OK && spawn.room.memory.energySummary) {
                    spawn.room.memory.energySummary.push({
                        consumes: cost,
                        production: 0,
                    });
                }
                return spawned;
            }
        }
    }
    const upgradeContainer = (_b = spawn.room.controller) === null || _b === void 0 ? void 0 : _b.pos.findClosestByRange(FIND_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_CONTAINER });
    const upgradeContainerRate = upgradeContainer ? (0, utils_1.getCapacityRate)(upgradeContainer) : 0;
    if ((creepsInRoom.upgrader || []).length < upgradeContainerRate / 0.75 &&
        spawn.room.energyAvailable > Math.max(200, spawn.room.energyCapacityAvailable * 0.8)) {
        const { bodies, cost } = (0, util_creep_1.filterBodiesByCost)("upgrader", spawn.room.energyAvailable);
        const spawned = spawn.spawnCreep(bodies, generateCreepName("upgrader"), {
            memory: {
                role: "upgrader",
            },
        });
        if (spawned === OK && spawn.room.memory.energySummary) {
            spawn.room.memory.energySummary.push({
                consumes: cost,
                production: 0,
            });
        }
        return spawned;
    }
    if (spawn.room.find(FIND_MY_CONSTRUCTION_SITES).length &&
        (creepsInRoom.builder || []).length < upgradeContainerRate / 0.5 &&
        spawn.room.energyAvailable > Math.max(200, spawn.room.energyCapacityAvailable * 0.6)) {
        const { bodies, cost } = (0, util_creep_1.filterBodiesByCost)("builder", spawn.room.energyAvailable);
        const spawned = spawn.spawnCreep(bodies, generateCreepName("builder"), {
            memory: {
                role: "builder",
                mode: "💪",
            },
        });
        if (spawned === OK && spawn.room.memory.energySummary) {
            spawn.room.memory.energySummary.push({
                consumes: cost,
                production: 0,
            });
        }
        return spawned;
    }
    if (spawn.room.find(FIND_STRUCTURES, { filter: (s) => s.structureType !== STRUCTURE_WALL && s.hits < s.hitsMax * 0.5 }).length &&
        ((creepsInRoom === null || creepsInRoom === void 0 ? void 0 : creepsInRoom.repairer) || []).length < 1 &&
        spawn.room.energyAvailable > Math.max(200, spawn.room.energyCapacityAvailable * 0.9)) {
        const { bodies, cost } = (0, util_creep_1.filterBodiesByCost)("repairer", spawn.room.energyAvailable);
        const spawned = spawn.spawnCreep(bodies, generateCreepName("repairer"), {
            memory: {
                role: "repairer",
                mode: "💪",
            },
        });
        if (spawned === OK && spawn.room.memory.energySummary) {
            spawn.room.memory.energySummary.push({
                consumes: cost,
                production: 0,
            });
        }
        return spawned;
    }
    return OK;
};
const generateCreepName = (role) => {
    const shortName = {
        builder: "B",
        gatherer: "G",
        distributer: "D",
        harvester: "H",
        repairer: "R",
        upgrader: "U",
    };
    return (lodash_1.default.range(100)
        .map((i) => `${shortName[role]}_${i}`)
        .find((name) => !Game.creeps[name]) || Game.time.toString());
};
exports.default = behavior;
