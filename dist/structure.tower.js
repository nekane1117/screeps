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
        tower.store.getUsedCapacity(RESOURCE_ENERGY) / tower.store.getCapacity(RESOURCE_ENERGY) > 0.8 &&
            _(tower.room.find(FIND_STRUCTURES, { filter: (s) => s.hits < s.hitsMax }))
                .tap((damaged) => {
                const minHit = _(damaged)
                    .map((s) => s.hits)
                    .min();
                const minHits = _(damaged)
                    .filter((s) => s.hits === minHit)
                    .run() || [];
                const target = tower.pos.findClosestByRange(minHits);
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
