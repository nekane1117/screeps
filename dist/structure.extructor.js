"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
function behavior(extractor) {
    if (!isE(extractor)) {
        return console.log("type is invalid", JSON.stringify(extractor));
    }
    const mineral = _(extractor.pos.lookFor(LOOK_MINERALS)).first();
    if (!mineral || mineral.ticksToRegeneration || !extractor.room.terminal) {
        return ERR_NOT_FOUND;
    }
    const { container } = (0, utils_1.findMyStructures)(extractor.room);
    if (extractor.room.terminal.store[mineral.mineralType] > constants_1.TERMINAL_THRESHOLD * 2) {
        return;
    }
    const { mineralHarvester = [], mineralCarrier = [] } = (0, util_creep_1.getCreepsInRoom)(mineral.room);
    if (mineral.mineralAmount > 0 && mineralHarvester.length < 1) {
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
    if (container.find((s) => s.store[mineral.mineralType] > 0) && mineralCarrier.length < 1) {
        const spawn = _((0, utils_1.getSpawnsInRoom)(extractor.room))
            .filter((s) => !s.spawning)
            .first();
        if (!spawn) {
            console.log(`source ${extractor.id} can't find spawn`);
            return ERR_NOT_FOUND;
        }
        if (extractor.room.energyAvailable >= extractor.room.energyCapacityAvailable) {
            const name = `Mc_${extractor.room.name}_${Game.time}`;
            const spawned = spawn.spawnCreep((0, util_creep_1.getCarrierBody)(extractor.room, "mineralCarrier"), name, {
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
