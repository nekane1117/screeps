import { CreepBehavior } from "./roles";
import { customMove } from "./util.creep";

const behavior: CreepBehavior = (creep: Creeps) => {
  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) =>
    customMove(creep, target, {
      ...opt,
    });

  if (!isD(creep)) {
    return console.log(`${creep.name} is not Defender`);
  }

  if (creep.room.name !== creep.memory.baseRoom) {
    const controller = Game.rooms[creep.memory.baseRoom]?.controller;
    return controller && moveMeTo(controller);
  }

  if (
    creep.memory.targetId ||
    (creep.memory.targetId = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS)?.id) ||
    (creep.memory.targetId = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES)?.id)
  ) {
    const target = Game.getObjectById(creep.memory.targetId);
    if (target) {
      // 目標に近寄る

      if ("structureType" in target || ("body" in target && target.body.filter((b) => b.type === ATTACK).length === 0)) {
        // 隣接してもいいやつの時は隣接する
        moveMeTo(target);
      } else {
        // 近接攻撃を持ってるやつの時

        // ターゲットの周囲にrampartがある場合
        const rampartInRange = target.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: (s): s is StructureRampart => s.structureType === STRUCTURE_RAMPART && s.my && target.pos.inRangeTo(s, 3),
        });

        if (rampartInRange) {
          moveMeTo(rampartInRange);
        } else if (creep.pos.isNearTo(target)) {
          // 近すぎるとき
          const start = creep.pos.getDirectionTo(target) + 3;
          creep.move(
            _.range(start, start + 3).map((dir) => {
              if (dir > 8) {
                dir = dir - 8;
              }
              return dir as DirectionConstant;
            })[_.random(2)],
          );
        } else {
          moveMeTo(target, { range: 3 });
        }
      }

      // 射程内の敵のあれこれ
      if (target) {
        creep.rangedAttack(target);
        if (creep.pos.isNearTo(target)) {
          "structureType" in target && creep.dismantle(target);
          creep.attack(target);
        }
      }
    } else {
      creep.memory.targetId = undefined;
      return ERR_NOT_FOUND;
    }
  }
  const heald = _(creep.pos.findInRange(FIND_MY_CREEPS, 3, { filter: (s) => s.hits < s.hitsMax - creep.getActiveBodyparts(HEAL) * HEAL_POWER }))
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
    .run().length;
  if (!creep.memory.targetId && heald === 0) {
    const spawn = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, { filter: (s): s is StructureSpawn => s.my && s.structureType === STRUCTURE_SPAWN });
    if (spawn && spawn.recycleCreep(creep) === ERR_NOT_IN_RANGE) {
      moveMeTo(spawn);
    }
  }
};

export default behavior;

function isD(creep: Creeps): creep is Defender {
  return creep.memory.role === "defender";
}
