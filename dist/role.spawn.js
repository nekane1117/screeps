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
    const sitesInRoom = Object.values(Game.constructionSites).filter((s) => { var _a; return ((_a = s.room) === null || _a === void 0 ? void 0 : _a.name) === spawn.room.name; });
    const upgradeContainer = (_b = spawn.room.controller) === null || _b === void 0 ? void 0 : _b.pos.findClosestByRange(FIND_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_CONTAINER });
    const upgradeContainerRate = upgradeContainer ? (0, utils_1.getCapacityRate)(upgradeContainer) : 0;
    if (sitesInRoom.length === 0 &&
        (creepsInRoom.upgrader || []).length < upgradeContainerRate / 0.9 &&
        spawn.room.energyAvailable > Math.max(200, spawn.room.energyCapacityAvailable * 0.8)) {
        const { bodies, cost } = (0, util_creep_1.filterBodiesByCost)("upgrader", spawn.room.energyAvailable);
        const spawned = spawn.spawnCreep(bodies, generateCreepName("upgrader"), {
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
    if (sitesInRoom.length &&
        (creepsInRoom.builder || []).length <
            Math.floor((0, lodash_1.default)(creepsInRoom.harvester || [])
                .map((h) => h.getActiveBodyparts(WORK))
                .sum() / 5) &&
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
                time: new Date().valueOf(),
                consumes: cost,
                production: 0,
            });
        }
        return spawned;
    }
    if ((0, utils_1.findMyStructures)(spawn.room).all.filter((s) => {
        return s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART && s.hits < s.hitsMax * 0.5;
    }).length &&
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
                time: new Date().valueOf(),
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
        claimer: "C",
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
