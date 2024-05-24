"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
function behavior(extractor) {
    if (!isE(extractor)) {
        return console.log("type is invalid", JSON.stringify(extractor));
    }
    const mineral = _(extractor.pos.lookFor(LOOK_MINERALS)).first();
    if (!mineral) {
        return ERR_NOT_FOUND;
    }
    if (!Object.values(Game.creeps).find((c) => isM(c) && c.memory.targetId === mineral.id)) {
        const spawn = (0, utils_1.getSpawnsOrderdByRange)(extractor, 1).first();
        if (!spawn) {
            console.log(`source ${extractor.id} can't find spawn`);
            return ERR_NOT_FOUND;
        }
        if (spawn.room.energyAvailable > 200) {
            const name = `M_${extractor.room.name}_${Game.time}`;
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
    return OK;
}
exports.default = behavior;
function isM(c) {
    return c.memory.role === "mineralHarvester";
}
function isE(s) {
    return s.structureType === STRUCTURE_EXTRACTOR;
}
