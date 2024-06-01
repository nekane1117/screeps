import { CreepBehavior } from "./roles";
import { complexOrder } from "./util.array";
import { RETURN_CODE_DECODER, customMove, isStoreTarget, pickUpAll, withdrawBy } from "./util.creep";
import { findMyStructures } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isBuilder(creep)) {
    return console.log(`${creep.name} is not Builder`);
  }
  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) =>
    customMove(creep, target, {
      ignoreCreeps: !creep.pos.inRangeTo(target, 4),
      ...opt,
    });

  const checkMode = () => {
    const newMode: BuilderMemory["mode"] = ((c: Builder) => {
      if (c.memory.mode === "💪" && c.store.energy === 0) {
        // 作業モードで空になったら収集モードにする
        return "🛒";
      }

      if (c.memory.mode === "🛒" && creep.store.energy >= CARRY_CAPACITY) {
        // 収集モードで50超えたら作業モードにする
        return "💪";
      }

      // そのまま
      return c.memory.mode;
    })(creep);
    if (newMode !== creep.memory.mode) {
      creep.memory.mode = newMode;
      creep.memory.buildingId = undefined;
      creep.memory.storeId = undefined;
      creep.say(creep.memory.mode);
    }
  };
  checkMode();

  // https://docs.screeps.com/simultaneous-actions.html

  const labs = findMyStructures(creep.room).lab.map((lab) => {
    return Object.assign(lab, {
      memory: creep.room.memory.labs[lab.id],
    }) as StructureLab & { memory: LabMemory };
  });

  // boostされてない場合
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

  // build
  if (
    creep.memory.buildingId ||
    (creep.memory.buildingId = complexOrder(Object.values(Game.constructionSites), [
      // 同じ部屋を優先
      (s) => (s.pos.roomName === creep.memory.baseRoom ? 0 : 1),
      // コンテナがあるときはコンテナ優先
      (s) => {
        switch (s.structureType) {
          case STRUCTURE_TOWER:
            return 0;
          case STRUCTURE_CONTAINER:
            return 1;
          default:
            return 2;
        }
      },
      // 残り作業が一番少ないやつ
      (s) => s.progressTotal - s.progress,
      // 近いやつ
      (s) => s.pos.getRangeTo(creep),
    ]).first()?.id)
  ) {
    const site = Game.getObjectById(creep.memory.buildingId);
    if (site) {
      switch ((creep.memory.built = creep.build(site))) {
        // 対象が変な時はクリアする
        case ERR_INVALID_TARGET:
          creep.memory.buildingId = undefined;
          break;
        // 建築モードで離れてるときは近寄る
        case ERR_NOT_IN_RANGE:
          if (creep.memory.mode === "💪") {
            moveMeTo(site);
          }
          break;

        // 有りえない系
        case ERR_NOT_OWNER: // 自creepじゃない
        case ERR_NO_BODYPART:
          console.log(`${creep.name} build returns ${RETURN_CODE_DECODER[creep.memory.built.toString()]}`);
          creep.say(RETURN_CODE_DECODER[creep.memory.built.toString()]);
          break;

        // 問題ない系
        case OK:
        case ERR_BUSY:
        case ERR_NOT_ENOUGH_RESOURCES:
        default:
          break;
      }
    } else {
      // 指定されていたソースが見つからないとき
      // 対象をクリア
      creep.memory.buildingId = undefined;
    }
  } else {
    // 本当に何もなければ死ぬ
    return creep.suicide();
  }

  // withdraw
  if (
    creep.memory.storeId ||
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
      maxRooms: 2,
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
          console.log(`${creep.name} build returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
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
  } else if (creep.memory.mode === "🛒") {
    const harvester = creep.pos.findClosestByRange(Object.values(Game.creeps), { filter: (c: Creeps) => c.memory.role === "harvester" });
    if (harvester && !creep.pos.isNearTo(harvester)) {
      moveMeTo(harvester);
    }
  }

  // withdraw
  withdrawBy(creep, ["harvester", "upgrader"]);

  // 落っこちてるものを拾う
  pickUpAll(creep);
};

export default behavior;

function isBuilder(creep: Creep): creep is Builder {
  return creep.memory.role === "builder";
}

const boosts: ResourceConstant[] = [RESOURCE_CATALYZED_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_HYDRIDE];
