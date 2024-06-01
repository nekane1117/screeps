import { CreepBehavior } from "./roles";
import { customMove, getMainSpawn } from "./util.creep";

const behavior: CreepBehavior = (creep: Creeps) => {
  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) =>
    customMove(creep, target, {
      ignoreCreeps: !creep.pos.inRangeTo(target, 2),
      ...opt,
    });

  if (!isD(creep)) {
    return console.log(`${creep.name} is not MineralCarrier`);
  }

  if (creep.room.name !== creep.memory.baseRoom) {
    const controller = Game.rooms[creep.memory.baseRoom]?.controller;
    return controller && moveMeTo(controller);
  }

  if (creep.memory.targetId || (creep.memory.targetId = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS)?.id)) {
    const target = Game.getObjectById(creep.memory.targetId);
    if (target) {
      // 目標に近寄る

      // ターゲットの周囲にrampartがある場合
      const rampartInRange = target.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (s): s is StructureRampart => s.structureType === STRUCTURE_RAMPART && s.my && target.pos.inRangeTo(s, 3),
      });

      if (rampartInRange) {
        moveMeTo(rampartInRange);
      } else if (!creep.pos.inRangeTo(target, 3)) {
        moveMeTo(target, { range: 3 });
      }

      // 射程内の敵のあれこれ
      _(creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3))
        .tap((hostiles) => {
          if (hostiles.length === 0) {
            return;
          } else if (hostiles.length === 1) {
            const hostile = hostiles[0];
            creep.rangedAttack(hostiles[0]);
            if (creep.pos.isNearTo(hostile)) {
              creep.attack(hostile);
            }
          } else {
            creep.rangedMassAttack();
          }
        })
        .run();
      _(creep.pos.findInRange(FIND_MY_CREEPS, 3))
        .tap((creeps) => {
          const target = _(creeps).min((c) => c.hits);

          if (target) {
            if (creep.pos.isNearTo(target)) {
              creep.heal(target);
            } else {
              creep.rangedHeal(target);
            }
          }
        })
        .run();
    } else {
      creep.memory.targetId = undefined;
      return ERR_NOT_FOUND;
    }
  } else {
    const spawn = getMainSpawn(creep.room);
    if (spawn) {
      if (spawn.recycleCreep(creep) === ERR_NOT_IN_RANGE) {
        moveMeTo(spawn);
      }
    } else {
      creep.suicide();
    }
  }
};

export default behavior;

function isD(creep: Creeps): creep is Defender {
  return creep.memory.role === "defender";
}
