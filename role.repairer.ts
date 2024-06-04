import { ROAD_DECAY_AMOUNT_SWAMP, ROAD_DECAY_AMOUNT_WALL } from "./constants";
import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, isStoreTarget, pickUpAll, withdrawBy } from "./util.creep";
import { findMyStructures } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isRepairer(creep)) {
    return console.log(`${creep.name} is not Repairer`);
  }

  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) =>
    customMove(creep, target, {
      ignoreCreeps: !creep.pos.inRangeTo(target, 2),
      ...opt,
    });

  const checkMode = () => {
    const newMode: RepairerMemory["mode"] = ((c: Repairer) => {
      if (c.memory.mode === "🔧" && creep.store.getUsedCapacity() === 0) {
        // 作業モードで空になったら収集モードにする
        return "🛒";
      }

      if (c.memory.mode === "🛒" && creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        // 収集モードで50超えたら作業モードにする
        return "🔧";
      }

      // そのまま
      return c.memory.mode;
    })(creep);

    if (newMode !== creep.memory.mode) {
      creep.memory.mode = newMode;
      creep.memory.targetId = undefined;
      creep.memory.storeId = undefined;
      creep.say(creep.memory.mode);
    }
  };
  checkMode();

  // https://docs.screeps.com/simultaneous-actions.html

  // boostされてない場合
  const labs = findMyStructures(creep.room).lab.map((lab) => {
    return Object.assign(lab, {
      memory: creep.room.memory.labs[lab.id],
    }) as StructureLab & { memory: LabMemory };
  });

  const { road, rampart, container } = findMyStructures(creep.room);

  const parts = creep.body.filter((b) => b.type === WORK);
  if (!creep.body.filter((b) => b.type === WORK).find((e) => boosts.includes(e.boost as ResourceConstant))) {
    //
    const lab = boosts
      .map((mineralType) => {
        return {
          mineralType,
          lab: labs.find((l) => {
            // 指定のミネラルでミネラル、エネルギーが足りるラボ
            return (
              l.mineralType === mineralType && l.store[mineralType] >= parts.length * LAB_BOOST_MINERAL && l.store.energy >= parts.length * LAB_BOOST_ENERGY
            );
          }),
        };
      })
      .find((o) => o.lab)?.lab;

    if (lab) {
      if (creep.pos.isNearTo(lab)) {
        return lab.boostCreep(creep);
      } else {
        return moveMeTo(lab);
      }
    }
  }

  const repairPower = _(creep.body)
    .filter((b) => b.type === WORK)
    .sum((b) => {
      return (
        REPAIR_POWER *
        (() => {
          const boost = b.boost;
          const workBoosts: Partial<{ [boost: string]: Partial<{ [action: string]: number }> }> = BOOSTS.work;
          if (typeof boost === "string") {
            return workBoosts[boost]?.repair || 1;
          } else {
            return 1;
          }
        })()
      );
    });

  // repair
  if (
    creep.memory.targetId ||
    // decayの10倍しかない壊れそうなやつ
    (creep.memory.targetId = creep.pos.findClosestByRange([...road, ...rampart, ...container], {
      filter: (s: StructureRampart | StructureContainer | StructureRoad) => {
        return (
          s.hits <=
          (() => {
            switch (s.structureType) {
              case "container":
                return CONTAINER_DECAY;
              case "rampart":
                return RAMPART_DECAY_AMOUNT;
              case "road":
                switch (_(s.pos.lookFor(LOOK_TERRAIN)).first()) {
                  case "wall":
                    return ROAD_DECAY_AMOUNT_WALL;
                  case "swamp":
                    return ROAD_DECAY_AMOUNT_SWAMP;
                  case "plain":
                  default:
                    return ROAD_DECAY_AMOUNT;
                }
            }
          })() *
            10
        );
      },
    })?.id) ||
    // 修理力より多くダメージを受けてるやつ
    (creep.memory.targetId = _(
      creep.room.find(FIND_STRUCTURES, {
        // ダメージのある建物
        filter: (s) => {
          // 閾値
          return s.hits <= s.hitsMax - repairPower;
        },
      }),
    ).min((s) => s.hits * ROAD_DECAY_TIME + ("ticksToDecay" in s ? s.ticksToDecay || 0 : ROAD_DECAY_TIME))?.id)
  ) {
    // repair
    const target = Game.getObjectById(creep.memory.targetId);
    if (target) {
      target.room.visual.text("x", target.pos, {
        opacity: 1 - _.ceil(target.hits / target.hitsMax, 1),
      });
      switch (creep.repair(target)) {
        case ERR_NOT_IN_RANGE:
          if (creep.memory.mode === "🔧") {
            moveMeTo(target);
          }
          break;
        case OK:
          // 成功しても近寄る
          creep.move(creep.pos.getDirectionTo(target));
          // 成功したら同じ種類で近くの一番壊れてるやつにリタゲする
          creep.memory.targetId = _(
            creep.pos.findInRange(FIND_STRUCTURES, 3, { filter: (s) => s.structureType === target.structureType && s.hits < s.hitsMax }),
          ).min((s) => s.hits)?.id;
          break;
        default:
          break;
      }
    }
  }

  // 向かってる途中とかに空になったらクリアする
  if ((creep.memory.storeId && Game.getObjectById(creep.memory.storeId))?.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.storeId = undefined;
  }

  // withdraw
  if (
    creep.memory.storeId ||
    // 機能不全に陥るのでstorageがあるときはsotrageからだけ取り出す
    (creep.memory.storeId = creep.room.storage?.id) ||
    (creep.memory.storeId = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s): s is StoreTarget => {
        return (
          s.structureType !== STRUCTURE_SPAWN &&
          isStoreTarget(s) &&
          s.structureType !== STRUCTURE_LINK &&
          (s.room.energyAvailable / s.room.energyCapacityAvailable > 0.9 ? true : s.structureType !== STRUCTURE_EXTENSION) &&
          s.store.energy > CARRY_CAPACITY
        );
      },
    })?.id)
  ) {
    const store = Game.getObjectById(creep.memory.storeId);
    if (store) {
      creep.memory.worked = creep.withdraw(store, RESOURCE_ENERGY);
      switch (creep.memory.worked) {
        case ERR_NOT_ENOUGH_RESOURCES: // 空っぽ
        case ERR_INVALID_TARGET: // 対象が変
          creep.memory.storeId = undefined;
          break;
        case ERR_NOT_IN_RANGE:
          if (creep.memory.mode === "🛒") {
            const moved = moveMeTo(store);
            if (moved !== OK) {
              console.log(`${creep.name} ${RETURN_CODE_DECODER[moved.toString()]}`);
              creep.say(RETURN_CODE_DECODER[moved.toString()]);
            }
          }
          break;
        // 有りえない系
        case ERR_NOT_OWNER:
        case ERR_INVALID_ARGS:
          console.log(`${creep.name} withdraw returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
          creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
          break;
        // 問題ない系
        case OK:
        case ERR_FULL:
        case ERR_BUSY:
        default:
          if (store.store.getUsedCapacity(RESOURCE_ENERGY) < creep.getActiveBodyparts(CARRY) * CARRY_CAPACITY) {
            creep.memory.storeId = undefined;
          }
          break;
      }
    }
  }

  // withdraw
  withdrawBy(creep, ["harvester", "upgrader"]);

  // 落っこちてるものを拾う
  pickUpAll(creep);
};

export default behavior;

function isRepairer(creep: Creep): creep is Repairer {
  return creep.memory.role === "repairer";
}

const boosts: ResourceConstant[] = [RESOURCE_CATALYZED_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_HYDRIDE];
