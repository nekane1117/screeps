"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function behaviors(tower) {
    var _a;
    if (!isTower(tower)) {
        return console.log(`${tower.id} is not tower`);
    }
    if (!((_a = tower.room.controller) === null || _a === void 0 ? void 0 : _a.safeMode)) {
        const target = tower.pos.findClosestByRange([
            ...tower.room.find(FIND_HOSTILE_CREEPS),
            ...tower.room.find(FIND_HOSTILE_POWER_CREEPS),
            ...tower.room.find(FIND_HOSTILE_SPAWNS),
            ...tower.room.find(FIND_HOSTILE_STRUCTURES),
        ]);
        target && tower.attack(target);
    }
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
exports.default = behaviors;
function isTower(s) {
    return s.structureType === STRUCTURE_TOWER;
}
