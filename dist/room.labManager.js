"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const util_creep_1 = require("./util.creep");
function behavior(labs, mineral) {
    const strategy = constants_1.LAB_STRATEGY[mineral.mineralType];
    if (!strategy) {
        return console.log(mineral.mineralType, "not have strategy");
    }
    const firstLab = _.first(labs);
    if (!firstLab) {
        return;
    }
    firstLab.room.memory.labs = firstLab.room.memory.labs || {};
    const labId = labs.map((lab) => lab.id);
    Object.keys(firstLab.room.memory.labs).forEach((id) => {
        if (!labId.includes(id) && mineral.room) {
            delete mineral.room.memory.labs[id];
        }
    });
    const { labManager = [] } = (0, util_creep_1.getCreepsInRoom)(firstLab.room);
    const bodies = (0, util_creep_1.filterBodiesByCost)("labManager", firstLab.room.energyAvailable).bodies;
    if (firstLab.room.energyAvailable === firstLab.room.energyCapacityAvailable &&
        labManager.filter((lm) => lm.ticksToLive && lm.ticksToLive > bodies.length * CREEP_SPAWN_TIME).length === 0) {
        const spawn = Object.values(Game.spawns).find((s) => !s.spawning);
        if (spawn) {
            spawn.spawnCreep(bodies, `Lm_${firstLab.room.name}_${Game.time}`, {
                memory: {
                    baseRoom: firstLab.room.name,
                    mode: "🛒",
                    role: "labManager",
                },
            });
        }
    }
    const labWithMemory = labs.slice(0, strategy.length).map((lab, i) => {
        const memory = lab.room.memory.labs[lab.id] ||
            (lab.room.memory.labs[lab.id] = {
                expectedType: strategy[i],
            });
        memory.expectedType = strategy[i];
        return Object.assign(lab, { memory });
    });
    labWithMemory.map((lab) => {
        lab.room.visual.text(lab.memory.expectedType, lab.pos.x, lab.pos.y, {
            color: "#008800",
        });
        const ingredients = constants_1.REVERSE_REACTIONS[lab.memory.expectedType];
        if ((!lab.mineralType || lab.mineralType === lab.memory.expectedType) && ingredients) {
            const [l1, l2] = ingredients.map((type) => {
                return labWithMemory.find((l) => {
                    return l.memory.expectedType === type && l.mineralType === l.memory.expectedType;
                });
            });
            if (l1 && l2) {
                lab.runReaction(l1, l2);
            }
        }
        return;
    });
}
exports.default = behavior;
