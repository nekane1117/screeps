export default function behaviors(tower: Structure) {
  if (!isTower(tower)) {
    return console.log(`${tower.id} is not tower`);
  }

  //   https://docs.screeps.com/simultaneous-actions.html

  const target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
  if (target) {
    tower.attack(target);
  } else {
    // repair
    // ダメージを受けている建物
    tower.store.getUsedCapacity(RESOURCE_ENERGY) / tower.store.getCapacity(RESOURCE_ENERGY) > 0.8 &&
      _(tower.room.find(FIND_STRUCTURES, { filter: (s: Structure): s is Structure<StructureConstant> => s.hits < s.hitsMax }))
        .tap((damaged) => {
          // の中で最少のHP
          const minHit = _(damaged)
            .map((s) => s.hits)
            .min();
          // の建物の一覧
          const minHits =
            _(damaged)
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
    _(tower.room.find(FIND_MY_CREEPS, { filter: (s: Creep): s is Creep => s.hits < s.hitsMax }))
      .tap((damaged) => {
        // の中で最少のHP
        const minHit = _(damaged)
          .map((s) => s.hits)
          .min();
        // の建物の一覧
        const minHits =
          _(damaged)
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
}

function isTower(s: Structure): s is StructureTower {
  return s.structureType === STRUCTURE_TOWER;
}