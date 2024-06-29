import { ROAD_DECAY_AMOUNT_SWAMP, ROAD_DECAY_AMOUNT_WALL } from "./constants";

export default function behaviors(tower: Structure) {
  if (!isTower(tower)) {
    return console.log(`${tower.id} is not tower`);
  }

  // https://docs.screeps.com/simultaneous-actions.html
  const target = _(tower.room.find(FIND_HOSTILE_CREEPS))
    .sort((c) => c.getActiveBodyparts(HEAL))
    .reverse()
    .first();
  if (target) {
    tower.attack(target);
  }

  // repair
  const decayStructures = _(
    tower.room.find(FIND_STRUCTURES, {
      filter: (s): s is StructureRampart | StructureRoad | StructureWall | StructureContainer => {
        if (s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL) {
          return s.hits < RAMPART_DECAY_AMOUNT * 10;
        } else if (s.structureType === STRUCTURE_ROAD) {
          switch (_.first(s.pos.lookFor(LOOK_TERRAIN))) {
            case "plain":
              return s.hits < ROAD_DECAY_AMOUNT * 10;
            case "swamp":
              return s.hits < ROAD_DECAY_AMOUNT_SWAMP * 10;
            case "wall":
              return s.hits < ROAD_DECAY_AMOUNT_WALL * 10;
            default:
              return false;
          }
        } else if (s.structureType === STRUCTURE_CONTAINER) {
          return s.hits < CONTAINER_DECAY * 10;
        } else {
          return false;
        }
      },
    }),
  );
  // decayのあるモノはタワーで緊急補修する
  if (decayStructures.size() > 0) {
    return tower.repair(
      decayStructures.min((s) => {
        return s.hits * ROAD_DECAY_TIME + ("ticksToDecay" in s ? s.ticksToDecay : ROAD_DECAY_TIME);
      }),
    );
  }

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

function isTower(s: Structure): s is StructureTower {
  return s.structureType === STRUCTURE_TOWER;
}
