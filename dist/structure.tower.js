"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
function behaviors(tower) {
    if (!isTower(tower)) {
        return console.log(`${tower.id} is not tower`);
    }
    const { tower: towers } = (0, utils_1.findMyStructures)(tower.room);
    const target = _(tower.room.find(FIND_HOSTILE_CREEPS))
        .sort((c) => c.getActiveBodyparts(HEAL))
        .reverse()
        .first();
    if (target) {
        tower.attack(target);
    }
    else {
        const brokenRampart = _(tower.room.find(FIND_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_RAMPART && s.hits < RAMPART_DECAY_AMOUNT * 2 }));
        if (brokenRampart.size() > 0) {
            return tower.repair(brokenRampart.min((s) => {
                return s.hits * (s.ticksToDecay / RAMPART_DECAY_TIME);
            }));
        }
        if (Game.time % (towers.length * 2) === 0 && tower.store.getUsedCapacity(RESOURCE_ENERGY) / tower.store.getCapacity(RESOURCE_ENERGY) > 0.8) {
            _(tower.room.find(FIND_STRUCTURES, {
                filter: (s) => {
                    return ((s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART
                        ? (Game.time % (0, utils_1.findMyStructures)(s.room).tower.length) * 2 === 0
                        : true) && s.hits < s.hitsMax);
                },
            }))
                .tap((damaged) => {
                const target = _(damaged).min((s) => {
                    return s.hits * 10000 + ("ticksToDecay" in s ? s.ticksToDecay || 0 : 0);
                });
                if (target) {
                    tower.repair(target);
                }
            })
                .run();
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
}
exports.default = behaviors;
function isTower(s) {
    return s.structureType === STRUCTURE_TOWER;
}
