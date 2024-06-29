"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
function behaviors(tower) {
    if (!isTower(tower)) {
        return console.log(`${tower.id} is not tower`);
    }
    const target = _(tower.room.find(FIND_HOSTILE_CREEPS))
        .sort((c) => c.getActiveBodyparts(HEAL))
        .reverse()
        .first();
    if (target) {
        tower.attack(target);
    }
    const decayStructures = _(tower.room.find(FIND_STRUCTURES, {
        filter: (s) => {
            if (s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL) {
                return s.hits < RAMPART_DECAY_AMOUNT * 10;
            }
            else if (s.structureType === STRUCTURE_ROAD) {
                switch (_.first(s.pos.lookFor(LOOK_TERRAIN))) {
                    case "plain":
                        return s.hits < ROAD_DECAY_AMOUNT * 10;
                    case "swamp":
                        return s.hits < constants_1.ROAD_DECAY_AMOUNT_SWAMP * 10;
                    case "wall":
                        return s.hits < constants_1.ROAD_DECAY_AMOUNT_WALL * 10;
                    default:
                        return false;
                }
            }
            else if (s.structureType === STRUCTURE_CONTAINER) {
                return s.hits < CONTAINER_DECAY * 10;
            }
            else {
                return false;
            }
        },
    }));
    if (decayStructures.size() > 0) {
        return tower.repair(decayStructures.min((s) => {
            return s.hits * ROAD_DECAY_TIME + ("ticksToDecay" in s ? s.ticksToDecay : ROAD_DECAY_TIME);
        }));
    }
    _(tower.room.find(FIND_MY_CREEPS, { filter: (s) => s.hits < s.hitsMax }))
        .tap((damaged) => {
        const minHit = _(damaged)
            .map((s) => s.hits)
            .min();
        const minHits = _(damaged)
            .filter((s) => s.hits === minHit)
            .run() || [];
        const target = tower.pos.findClosestByRange(minHits);
        if (target) {
            tower.heal(target);
        }
    })
        .run();
}
exports.default = behaviors;
function isTower(s) {
    return s.structureType === STRUCTURE_TOWER;
}
