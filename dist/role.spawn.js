"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const util_creep_1 = require("./util.creep");
const behavior = (spawn) => {
    if (spawn.spawning) {
        return;
    }
    const creepsInRoom = (0, lodash_1.default)((0, util_creep_1.getCreepsInRoom)(spawn.room))
        .map((name) => Game.creeps[name])
        .compact()
        .groupBy((c) => c.memory.role)
        .value();
    if ((creepsInRoom.harvester || []).length === 0) {
        return spawn.spawnCreep([MOVE, WORK, CARRY], generateCreepName("harvester"), {
            memory: {
                role: "harvester",
            },
        });
    }
    if (spawn.room.energyAvailable >= 200) {
        for (const source of spawn.room.find(FIND_SOURCES)) {
            const terrain = spawn.room.getTerrain();
            const maxCount = (0, lodash_1.default)(util_creep_1.squareDiff)
                .map(([dx, dy]) => {
                return terrain.get(source.pos.x + dx, source.pos.y + dy) !== TERRAIN_MASK_WALL ? 1 : 0;
            })
                .sum();
            const harvesters = (0, lodash_1.default)((0, util_creep_1.getCreepsInRoom)(spawn.room)
                .map((name) => Game.creeps[name])
                .filter((c) => {
                const isH = (c) => {
                    return c.memory.role === "harvester";
                };
                return c !== undefined && isH(c) && c.memory.harvestTargetId === source.id;
            }));
            if (harvesters.size() < maxCount && harvesters.map((c) => c.getActiveBodyparts(WORK)).sum() < 5) {
                return spawn.spawnCreep((0, util_creep_1.bodyMaker)("harvester", spawn.room.energyAvailable), generateCreepName("harvester"), {
                    memory: {
                        role: "harvester",
                        harvestTargetId: source.id,
                    },
                });
            }
        }
    }
    if ((creepsInRoom.upgrader || []).length === 0 &&
        spawn.room.energyAvailable > Math.max((0, util_creep_1.getBodyCost)(util_creep_1.MIN_BODY["upgrader"]), spawn.room.energyCapacityAvailable * 0.8)) {
        return spawn.spawnCreep((0, util_creep_1.bodyMaker)("upgrader", spawn.room.energyAvailable), generateCreepName("upgrader"), {
            memory: {
                role: "upgrader",
            },
        });
    }
    const filledStorages = spawn.room.find(FIND_STRUCTURES, {
        filter: (s) => {
            return [STRUCTURE_CONTAINER, STRUCTURE_STORAGE].some((t) => {
                return s.structureType === t && s.store.getUsedCapacity(RESOURCE_ENERGY) / s.store.getCapacity(RESOURCE_ENERGY) > 0.5;
            });
        },
    });
    if (spawn.room.find(FIND_MY_CONSTRUCTION_SITES).length &&
        (creepsInRoom.builder || []).length < filledStorages.length &&
        spawn.room.energyAvailable > Math.max((0, util_creep_1.getBodyCost)(util_creep_1.MIN_BODY["builder"]), spawn.room.energyCapacityAvailable * 0.8)) {
        return spawn.spawnCreep((0, util_creep_1.bodyMaker)("builder", spawn.room.energyAvailable), generateCreepName("builder"), {
            memory: {
                role: "builder",
                mode: "working",
            },
        });
    }
    if (spawn.room.find(FIND_STRUCTURES, { filter: (s) => s.structureType !== STRUCTURE_WALL && s.hits < s.hitsMax * 0.5 }).length &&
        ((creepsInRoom === null || creepsInRoom === void 0 ? void 0 : creepsInRoom.repairer) || []).length < filledStorages.length &&
        spawn.room.energyAvailable > Math.max((0, util_creep_1.getBodyCost)(util_creep_1.MIN_BODY["repairer"]), spawn.room.energyCapacityAvailable * 0.8)) {
        return spawn.spawnCreep((0, util_creep_1.bodyMaker)("repairer", spawn.room.energyAvailable), generateCreepName("repairer"), {
            memory: {
                role: "repairer",
                mode: "working",
            },
        });
    }
    if ((creepsInRoom.upgrader || []).length < filledStorages.length &&
        spawn.room.energyAvailable > Math.max((0, util_creep_1.getBodyCost)(util_creep_1.MIN_BODY["upgrader"]), spawn.room.energyCapacityAvailable * 0.8)) {
        return spawn.spawnCreep((0, util_creep_1.bodyMaker)("upgrader", spawn.room.energyAvailable), generateCreepName("upgrader"), {
            memory: {
                role: "upgrader",
            },
        });
    }
    return OK;
};
const generateCreepName = (role) => {
    const shortName = {
        builder: "B",
        carrier: "C",
        defender: "D",
        harvester: "G",
        repairer: "R",
        upgrader: "U",
    };
    return (lodash_1.default.range(100)
        .map((i) => `${shortName[role]}_${i}`)
        .find((name) => !Game.creeps[name]) || Game.time.toString());
};
exports.default = behavior;
