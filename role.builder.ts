import { ROAD_DECAY_AMOUNT_SWAMP, ROAD_DECAY_AMOUNT_WALL } from "./constants";
import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, isStoreTarget, pickUpAll, toColor, withdrawBy } from "./util.creep";
import { findMyStructures, getSitesInRoom } from "./utils";
// import { findMyStructures } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isBuilder(creep)) {
    return console.log(`${creep.name} is not Builder`);
  }
  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) =>
    customMove(creep, target, {
      ...opt,
    });

  const checkMode = () => {
    const newMode: BuilderMemory["mode"] = ((c: Builder) => {
      if (c.memory.mode === "👷" && c.store.energy === 0) {
        // 作業モードで空になったら収集モードにする
        return "🛒";
      }

      if (c.memory.mode === "🛒" && creep.store.energy >= CARRY_CAPACITY) {
        // 収集モードで50超えたら作業モードにする
        return "👷";
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

  // 不正な対象の時は初期化する
  if (creep.memory.firstAidId) {
    const target = Game.getObjectById(creep.memory.firstAidId);
    // 取れない or 満タンの時は初期化する
    if (!target || target.hits === target.hitsMax) {
      creep.memory.firstAidId = undefined;
    }
  }
  const { road, rampart, container } = findMyStructures(creep.room);

  // 応急修理が要るものを探す
  if (!creep.memory.firstAidId) {
    creep.memory.firstAidId = creep.pos.findClosestByRange([...road, ...rampart, ...container], {
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
    })?.id;
  }

  // 応急修理する
  if (creep.memory.firstAidId) {
    // boostされてない場合
    if (!isBoosted(creep)) {
      return boost(creep);
    }

    const target = Game.getObjectById(creep.memory.firstAidId);
    if (target) {
      target.room.visual.text("x", target.pos, {
        opacity: 1 - target.hits / target.hitsMax,
        color: toColor(creep),
      });
      return _(creep.repair(target))
        .tap((code) => {
          if (code === ERR_NOT_IN_RANGE) {
            // 作業モードの時は近寄る
            if (creep.memory.mode === "👷") {
              moveMeTo(target);
            }
          }
        })
        .run();
    }
  }

  // 建設する
  if (
    creep.memory.buildingId ||
    (creep.memory.buildingId = (() => {
      // 自室のサイト
      const sites = getSitesInRoom(Game.rooms[creep.memory.baseRoom]);
      if (sites.length === 0) {
        return undefined;
      }

      // 残作業が一番少ない一番近いやつ
      const minRemaning = _(sites)
        .map((s) => s.progressTotal - s.progress)
        .min();
      return creep.pos.findClosestByRange(
        _(sites)
          .filter((s) => minRemaning === s.progressTotal - s.progress)
          .run(),
      );
    })()?.id)
  ) {
    // boostされてない場合
    if (!isBoosted(creep)) {
      return boost(creep);
    }

    const site = Game.getObjectById(creep.memory.buildingId);
    if (site) {
      return _((creep.memory.built = creep.build(site)))
        .tap((built) => {
          switch (built) {
            // 対象が変な時はクリアする
            case ERR_INVALID_TARGET:
              creep.memory.buildingId = undefined;
              break;
            // 建築モードで離れてるときは近寄る
            case ERR_NOT_IN_RANGE:
              if (creep.memory.mode === "👷") {
                moveMeTo(site);
              }
              break;

            // 有りえない系
            case ERR_NOT_OWNER: // 自creepじゃない
            case ERR_NO_BODYPART:
              console.log(`${creep.name} build returns ${RETURN_CODE_DECODER[built.toString()]}`);
              creep.say(RETURN_CODE_DECODER[built.toString()]);
              break;

            // 問題ない系
            case OK:
            case ERR_BUSY:
            case ERR_NOT_ENOUGH_RESOURCES:
            default:
              break;
          }
        })
        .run();
    } else {
      // 指定されていたソースが見つからないとき
      // 対象をクリア
      creep.memory.buildingId = undefined;
    }
  }

  // 建設がなければ修理する

  // 不正なものを初期化する
  if (creep.memory.repairId) {
    const target = creep.memory.repairId && Game.getObjectById(creep.memory.repairId);
    if (!target || target.hits === target.hitsMax) {
      creep.memory.repairId = undefined;
    }
  }

  // 対象を探す
  if (
    creep.memory.repairId ||
    (creep.memory.repairId = _(
      creep.room.find(FIND_STRUCTURES, {
        // ダメージのある建物
        filter: (s) => {
          // 閾値
          return s.hits <= s.hitsMax - repairPower;
        },
      }),
    ).min((s) => s.hits * ROAD_DECAY_TIME + ("ticksToDecay" in s ? s.ticksToDecay || 0 : ROAD_DECAY_TIME))?.id)
  ) {
    const target = creep.memory.repairId && Game.getObjectById(creep.memory.repairId);
    if (target) {
      // boostされてない場合
      if (!isBoosted(creep)) {
        return boost(creep);
      }

      target.room.visual.text("x", target.pos, {
        opacity: 1 - _.ceil(target.hits / target.hitsMax, 1),
      });
      return _(creep.repair(target))
        .tap((repaired) => {
          switch (repaired) {
            case ERR_NOT_IN_RANGE:
              // 作業モードの時は近寄る
              if (creep.memory.mode === "👷") {
                moveMeTo(target);
              }
              return;
            case OK:
              // 作業モードの時は近寄る
              if (creep.memory.mode === "👷") {
                // 成功しても近寄る
                moveMeTo(target);
              }
              // 成功したら同じ種類で近くの一番壊れてるやつにリタゲする
              creep.memory.repairId = _(
                creep.pos.findInRange(FIND_STRUCTURES, 3, { filter: (s) => s.structureType === target.structureType && s.hits < s.hitsMax }),
              ).min((s) => s.hits)?.id;
              return;
            default:
              return;
          }
        })
        .run();
    }
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
    const harvester = creep.pos.findClosestByRange(Object.values(Game.creeps), {
      filter: (c: Creeps) => c.memory.role === "harvester" || c.memory.role === "remoteHarvester",
    });
    if (harvester && !creep.pos.isNearTo(harvester)) {
      moveMeTo(harvester);
    }
  }

  // withdraw
  withdrawBy(creep, ["harvester", "upgrader", "remoteHarvester"]);

  // 落っこちてるものを拾う
  pickUpAll(creep);
};

export default behavior;

function isBuilder(creep: Creep): creep is Builder {
  return creep.memory.role === "builder";
}

const boosts: ResourceConstant[] = [RESOURCE_CATALYZED_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_HYDRIDE];

function isBoosted(creep: Builder) {
  // いずれかがboots無しでない
  return !creep.body.some((b) => b.type === WORK && b.boost === undefined);
}

function boost(creep: Builder) {
  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) =>
    customMove(creep, target, {
      ...opt,
    });

  const labs = findMyStructures(creep.room).lab.map((lab) => {
    return Object.assign(lab, {
      memory: creep.room.memory.labs[lab.id],
    }) as StructureLab & { memory: LabMemory };
  });

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
}
