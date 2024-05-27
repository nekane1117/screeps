"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
function behavior(extractor) {
    if (!isE(extractor)) {
        return console.log("type is invalid", JSON.stringify(extractor));
    }
    const mineral = _(extractor.pos.lookFor(LOOK_MINERALS)).first();
    const terminal = _((0, utils_1.findMyStructures)(extractor.room).terminal).first();
    if (!mineral || mineral.ticksToRegeneration || !terminal) {
        return ERR_NOT_FOUND;
    }
    if (terminal.store[mineral.mineralType] > 10000) {
        return;
    }
    const { mineralHarvester = [], mineralCarrier = [] } = Object.values(Game.creeps)
        .filter((c) => c.memory.baseRoom === extractor.pos.roomName)
        .reduce((groups, c) => {
        (groups[c.memory.role] = groups[c.memory.role] || []).push(c);
        return groups;
    }, {});
    if (!mineralHarvester.find((c) => c.memory.targetId === mineral.id)) {
        const spawn = (0, utils_1.getSpawnsOrderdByRange)(extractor, 1).first();
        if (!spawn) {
            console.log(`source ${extractor.id} can't find spawn`);
            return ERR_NOT_FOUND;
        }
        if (spawn.room.energyAvailable > 200) {
            const name = `Mh_${extractor.room.name}_${Game.time}`;
            const spawned = spawn.spawnCreep((0, util_creep_1.filterBodiesByCost)("mineralHarvester", spawn.room.energyAvailable).bodies, name, {
                memory: {
                    role: "mineralHarvester",
                    baseRoom: extractor.room.name,
                    targetId: mineral.id,
                },
            });
            return spawned;
        }
    }
    else if (mineralCarrier.length < 1) {
        const spawn = (0, utils_1.getSpawnsOrderdByRange)(extractor, 1).first();
        if (!spawn) {
            console.log(`source ${extractor.id} can't find spawn`);
            return ERR_NOT_FOUND;
        }
        if (spawn.room.energyAvailable > 1000) {
            const name = `Mc_${extractor.room.name}_${Game.time}`;
            const spawned = spawn.spawnCreep((0, util_creep_1.filterBodiesByCost)("mineralCarrier", spawn.room.energyAvailable).bodies, name, {
                memory: {
                    role: "mineralCarrier",
                    baseRoom: extractor.room.name,
                    mode: "🛒",
                },
            });
            return spawned;
        }
    }
    return OK;
}
exports.default = behavior;
function isE(s) {
    return s.structureType === STRUCTURE_EXTRACTOR;
}
