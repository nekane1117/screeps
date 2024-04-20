"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const const_1 = require("./const");
const util_creep_1 = require("./util.creep");
const behavior = (spawn) => {
    const creeps = Object.entries(Game.creeps).map((e) => e[1]);
    // １匹もいないときはとにかく作る
    if (creeps.length === 0) {
        return spawn.spawnCreep(
        // とりあえず最小単位
        [MOVE, WORK, CARRY], generateCreepName(spawn, "harvester"), {
            memory: {
                role: "harvester",
            },
        });
    }
    // 資源から2マス離れた所にコンテナを置く
    const sources = spawn.room.find(FIND_SOURCES);
    if (spawn.room.find(FIND_STRUCTURES, {
        filter: (s) => s.structureType === STRUCTURE_CONTAINER,
    }).length < sources.length) {
        sources.forEach((s) => {
            const pathStep = s.pos.findPathTo(spawn.pos, {
                ignoreCreeps: true,
                swampCost: 1,
            })[1];
            if (pathStep) {
                spawn.room.createConstructionSite(pathStep.x, pathStep.y, STRUCTURE_CONTAINER);
            }
        });
    }
    // harvesterが不足しているとき
    if (creeps.filter((c) => c.memory.role === "harvester").length <
        spawn.room.find(FIND_SOURCES).length * 2 &&
        spawn.store[RESOURCE_ENERGY] > const_1.HARVESTER_MIN_ENERGY) {
        return spawn.spawnCreep((0, util_creep_1.bodyMaker)("harvester", spawn.store[RESOURCE_ENERGY]), generateCreepName(spawn, "harvester"), {
            memory: {
                role: "harvester",
            },
        });
    }
    return OK;
};
const generateCreepName = (spawn, role) => {
    const shortName = {
        builder: "BLD",
        carrier: "CAR",
        defender: "DEF",
        harvester: "HAV",
        repairer: "REP",
    };
    return (lodash_1.default.range(100)
        .map((i) => `${spawn.room.name}_${shortName[role]}_${i}`)
        .find((name) => !Game.creeps[name]) || Game.time.toString());
};
exports.default = behavior;
