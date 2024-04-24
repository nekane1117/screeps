"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const util_creep_1 = require("./util.creep");
const behavior = (spawn) => {
    var _a;
    if (spawn.spawning) {
        return;
    }
    const creepsInRoom = (0, lodash_1.default)((0, util_creep_1.getCreepsInRoom)(spawn.room))
        .map((name) => Game.creeps[name])
        .compact()
        .groupBy((c) => c.memory.role)
        .value();
    // １匹もいないときはとにかく作る
    if ((creepsInRoom.harvester || []).length === 0) {
        return spawn.spawnCreep(
        // とりあえず最小単位
        [MOVE, WORK, CARRY], generateCreepName(spawn, "harvester"), {
            memory: {
                role: "harvester",
            },
        });
    }
    // upgraderが居ないときもとりあえず作る
    if ((creepsInRoom.upgrader || []).length === 0 && spawn.room.energyAvailable > (0, util_creep_1.getBodyCost)(util_creep_1.MIN_BODY["upgrader"])) {
        return spawn.spawnCreep((0, util_creep_1.bodyMaker)("upgrader", spawn.room.energyAvailable), generateCreepName(spawn, "upgrader"), {
            memory: {
                role: "upgrader",
            },
        });
    }
    // harvesterが不足しているとき
    if ((creepsInRoom.harvester || []).length < spawn.room.find(FIND_SOURCES).length * 2 &&
        spawn.room.energyAvailable > Math.max((0, util_creep_1.getBodyCost)(util_creep_1.MIN_BODY["harvester"]), spawn.room.energyCapacityAvailable * 0.6)) {
        return spawn.spawnCreep((0, util_creep_1.bodyMaker)("harvester", spawn.room.energyAvailable), generateCreepName(spawn, "harvester"), {
            memory: {
                role: "harvester",
            },
        });
    }
    // builderが不足しているとき
    if (spawn.room.find(FIND_MY_CONSTRUCTION_SITES).length && // 建設がある
        !((_a = creepsInRoom.builder) === null || _a === void 0 ? void 0 : _a.length) && // いない
        spawn.room.energyAvailable > Math.max((0, util_creep_1.getBodyCost)(util_creep_1.MIN_BODY["builder"]), spawn.room.energyCapacityAvailable * 0.8) // エネルギー余ってる
    ) {
        return spawn.spawnCreep((0, util_creep_1.bodyMaker)("builder", spawn.room.energyAvailable), generateCreepName(spawn, "builder"), {
            memory: {
                role: "builder",
                mode: "working",
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
        upgrader: "UPG",
    };
    return (lodash_1.default.range(100)
        .map((i) => `${spawn.room.name}_${shortName[role]}_${i}`)
        .find((name) => !Game.creeps[name]) || Game.time.toString());
};
exports.default = behavior;
