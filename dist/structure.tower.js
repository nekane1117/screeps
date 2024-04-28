"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function behaviors(tower) {
    var _a;
    if (!isTower(tower)) {
        return console.log(`${tower.id} is not tower`);
    }
    //   https://docs.screeps.com/simultaneous-actions.html
    // attack
    if (!((_a = tower.room.controller) === null || _a === void 0 ? void 0 : _a.safeMode)) {
        // safe modeじゃなければ一番近い敵に攻撃する
        const target = tower.pos.findClosestByRange([
            ...tower.room.find(FIND_HOSTILE_CREEPS),
            ...tower.room.find(FIND_HOSTILE_POWER_CREEPS),
            ...tower.room.find(FIND_HOSTILE_SPAWNS),
            ...tower.room.find(FIND_HOSTILE_STRUCTURES),
        ]);
        target && tower.attack(target);
    }
    // repair
    // ダメージを受けている建物
    _(tower.room.find(FIND_STRUCTURES, { filter: (s) => s.hits < s.hitsMax }))
        .tap((damaged) => {
        // の中で最少のHP
        const minHit = _(damaged)
            .map((s) => s.hits)
            .min();
        // の建物の一覧
        const minHits = _(damaged)
            .filter((s) => s.hits === minHit)
            .run() || [];
        // の中から一番近いやつ
        const target = tower.pos.findClosestByRange(minHits);
        // があれば修理する
        if (target) {
            tower.repair(target);
        }
    })
        .run();
    // heal
    _(tower.room.find(FIND_MY_CREEPS, { filter: (s) => s.hits < s.hitsMax }))
        .tap((damaged) => {
        // の中で最少のHP
        const minHit = _(damaged)
            .map((s) => s.hits)
            .min();
        // の建物の一覧
        const minHits = _(damaged)
            .filter((s) => s.hits === minHit)
            .run() || [];
        // の中から一番近いやつ
        const target = tower.pos.findClosestByRange(minHits);
        // があれば修理する
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
