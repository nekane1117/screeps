"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
function behavior(labs, mineral) {
    var _a;
    const firstLab = _.first(labs);
    if (!firstLab) {
        return;
    }
    const strategy = constants_1.LAB_STRATEGY[mineral.mineralType];
    if (!strategy) {
        return console.log(mineral.mineralType, "not have strategy");
    }
    firstLab.room.memory.labs = firstLab.room.memory.labs || {};
    const labId = labs.map((lab) => lab.id);
    Object.keys(firstLab.room.memory.labs).forEach((id) => {
        if (!labId.includes(id) && mineral.room) {
            delete mineral.room.memory.labs[id];
        }
    });
    const { labManager = [] } = (0, util_creep_1.getCreepsInRoom)(firstLab.room);
    const bodies = (0, util_creep_1.getCarrierBody)(firstLab.room, "labManager");
    if (firstLab.room.terminal &&
        firstLab.room.terminal.store.energy > firstLab.room.energyCapacityAvailable &&
        firstLab.room.energyAvailable === firstLab.room.energyCapacityAvailable &&
        labManager.filter((lm) => (lm.ticksToLive || Infinity) > bodies.length * CREEP_SPAWN_TIME).length === 0) {
        const spawn = (_a = (0, utils_1.getSpawnsInRoom)(firstLab.pos.roomName)) === null || _a === void 0 ? void 0 : _a.find((s) => !s.spawning);
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
            font: 0.25,
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
