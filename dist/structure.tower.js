"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function behaviors(tower) {
    if (!isTower(tower)) {
        return console.log(`${tower.id} is not tower`);
    }
    const target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if (target) {
        tower.attack(target);
    }
    else {
        const brokenRampart = _(tower.room.find(FIND_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_RAMPART && s.hits < 1000 }));
        if (brokenRampart.size() > 0) {
            return tower.repair(brokenRampart.min((s) => {
                return s.hits * (s.ticksToDecay / RAMPART_DECAY_TIME);
            }));
        }
        tower.store.getUsedCapacity(RESOURCE_ENERGY) / tower.store.getCapacity(RESOURCE_ENERGY) > 0.8 &&
            _(tower.room.find(FIND_STRUCTURES, {
                filter: (s) => {
                    return ((s.structureType === STRUCTURE_WALL
                        ?
                            Game.time % 4 === 0
                        : true) && s.hits < s.hitsMax);
                },
            }))
                .tap((damaged) => {
                const target = _(damaged).min((s) => s.hits);
                if (target) {
                    tower.repair(target);
                }
            })
                .run();
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
