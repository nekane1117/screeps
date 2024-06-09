import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, pickUpAll, toColor, withdrawBy } from "./util.creep";
import { findMyStructures, getDecayAmount, getSitesInRoom } from "./utils";
// import { findMyStructures } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isBuilder(creep)) {
    return console.log(`${creep.name} is not Builder`);
  }
  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) => {
    const pos = "pos" in target ? target.pos : target;
    Game.rooms[pos.roomName]?.visual.text("x", pos, {
      color: toColor(creep),
    });
    return customMove(creep, target, {
      ...opt,
    });
  };

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
      creep.memory.firstAidId = undefined;
      creep.memory.buildingId = undefined;
      creep.memory.storeId = undefined;
      creep.say(creep.memory.mode);
    }
  };
  checkMode();

  // https://docs.screeps.com/simultaneous-actions.html
  if (creep.memory.mode === "👷") {
    // 作業モードの時

    // #region 応急処置###########################################################################################
    // 不正な対象の時は初期化する
    if (creep.memory.firstAidId) {
      const target = Game.getObjectById(creep.memory.firstAidId);
      // 取れない or 満タンの時は初期化する
      if (!target || target.hits > getDecayAmount(target) * 10) {
        creep.memory.firstAidId = undefined;
      }
    }
    const { road, rampart, container } = findMyStructures(creep.room);

    // 応急修理が要るものを探す
    if (!creep.memory.firstAidId) {
      creep.memory.firstAidId = creep.pos.findClosestByRange([...road, ...rampart, ...container], {
        filter: (s: Structure) => {
          return s.hits <= getDecayAmount(s) * 10;
        },
      })?.id;
    }

    // 応急修理する
    if (creep.memory.firstAidId) {
      // boostされてない場合
      if (!isBoosted(creep) && boost(creep) !== null) {
        return;
      }

      const target = Game.getObjectById(creep.memory.firstAidId);
      if (target) {
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
    // #endregion

    // #region 建設 ###########################################################################################
    // 不正な対象の時は初期化する
    if (creep.memory.buildingId) {
      const target = Game.getObjectById(creep.memory.buildingId);
      // 取れない or 満タンの時は初期化する
      if (!target) {
        creep.memory.buildingId = undefined;
      }
    }

    if (
      creep.memory.buildingId ||
      // 可読性悪いので条件は関数化
      (creep.memory.buildingId = findBuildTarget(creep))
    ) {
      // boostされてない場合
      if (!isBoosted(creep) && boost(creep) !== null) {
        return;
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
                moveMeTo(site);
                break;

              // 有りえない系
              case ERR_NOT_OWNER: // 自creepじゃない
              case ERR_NO_BODYPART:
                console.log(`${creep.name} build returns ${RETURN_CODE_DECODER[built?.toString()]}`);
                creep.say(RETURN_CODE_DECODER[built?.toString()]);
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
      }
    }

    // #endregion
    // #region 修理 ###########################################################################################
    // 不正なものを初期化する
    if (creep.memory.repairId) {
      const target = creep.memory.repairId && Game.getObjectById(creep.memory.repairId);

      // 見つからない or 直ってる
      if (!target || target.hits === target.hitsMax) {
        creep.memory.repairId = undefined;
      }
    }

    // 対象を探す
    if (creep.memory.repairId || (creep.memory.repairId = findRepairTarget(creep))) {
      const target = creep.memory.repairId && Game.getObjectById(creep.memory.repairId);
      if (target) {
        // boostされてない場合
        if (!isBoosted(creep) && boost(creep) !== null) {
          return;
        }

        target.room.visual.text("x", target.pos, {
          opacity: 1 - _.ceil(target.hits / target.hitsMax, 1),
        });
        return _(creep.repair(target))
          .tap((repaired) => {
            switch (repaired) {
              case ERR_NOT_IN_RANGE:
                return moveMeTo(target);
              case OK:
                // 成功したら同じ種類で近くの一番壊れてるやつにリタゲする
                creep.memory.repairId = _(
                  creep.pos.findInRange(FIND_STRUCTURES, 4, { filter: (s) => s.structureType === target.structureType && s.hits < s.hitsMax }),
                ).min((s) => s.hits)?.id;
                return;
              default:
                return;
            }
          })
          .run();
      }
    }
    // #endregion
  } else {
    // 収集モードの時
    if (creep.room.energyAvailable < 300) {
      return;
    }

    // #region エネルギー回収###########################################################################################
    // 空のやつ初期化
    creep.memory.storeId = (() => {
      const store = creep.memory.storeId && Game.getObjectById(creep.memory.storeId);
      if (!store || !("store" in store) || store.store.energy === 0) {
        return undefined;
      } else {
        return creep.memory.storeId;
      }
    })();

    // withdraw
    if (
      creep.memory.storeId ||
      (creep.memory.storeId = creep.pos.findClosestByPath([...creep.room.find(FIND_TOMBSTONES), ...creep.room.find(FIND_RUINS)], {
        filter: (s) => s.store.energy > 0,
      })?.id) ||
      (creep.memory.storeId = creep.room.storage?.id) ||
      (creep.memory.storeId = creep.pos.findClosestByPath([...findMyStructures(creep.room).all], {
        filter: (s) => {
          // いっぱいあるやつからだけ出す
          return (
            "store" in s &&
            s.store.energy >= creep.store.getCapacity(RESOURCE_ENERGY) &&
            !([STRUCTURE_TOWER, STRUCTURE_LINK, STRUCTURE_TERMINAL, STRUCTURE_EXTENSION, STRUCTURE_SPAWN] as StructureConstant[]).includes(s.structureType)
          );
        },
      })?.id)
    ) {
      const store = Game.getObjectById(creep.memory.storeId);
      if (store && "store" in store) {
        creep.memory.worked = creep.withdraw(store, RESOURCE_ENERGY);
        switch (creep.memory.worked) {
          case ERR_NOT_ENOUGH_RESOURCES: // 空っぽ
          case ERR_INVALID_TARGET: // 対象が変
            creep.memory.storeId = undefined;
            break;
          case ERR_NOT_IN_RANGE:
            _(moveMeTo(store))
              .tap((moved) => {
                if (moved !== OK) {
                  console.log(`${creep.name} ${RETURN_CODE_DECODER[moved.toString()]}`);
                  creep.say(RETURN_CODE_DECODER[moved.toString()]);
                }
              })
              .run();
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
    } else {
      // 対象が無いときは最寄りのharvesterにもらいに行く
      const harvester = creep.pos.findClosestByRange(Object.values(Game.creeps), {
        filter: (c: Creeps) => c.memory.role === "harvester" || c.memory.role === "remoteHarvester",
      });
      if (harvester && !creep.pos.isNearTo(harvester)) {
        moveMeTo(harvester);
      }
    }
    // #endregion

    // withdraw
    withdrawBy(creep, ["harvester", "upgrader", "remoteHarvester"]);

    // 落っこちてるものを拾う
    pickUpAll(creep);
  }
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
    } else {
      return null;
    }
  } else {
    return null;
  }
}

function findBuildTarget(creep: Builder) {
  return _(getSitesInRoom(Game.rooms[creep.memory.baseRoom]))
    .sortBy((s) => {
      // 残作業量に(距離+1)をかけたやつを優先
      return (s.progressTotal - s.progress) * (s.pos.getRangeTo(creep) + 1);
    })
    .first()?.id;
}

function findRepairTarget(creep: Builder) {
  return _(
    creep.room.find(FIND_STRUCTURES, {
      // ダメージのある建物
      filter: (s) => {
        // 閾値
        return (
          s.hits <=
          s.hitsMax -
            _(creep.body)
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
              })
        );
      },
    }),
  ).min((s) => s.hits * ROAD_DECAY_TIME + ("ticksToDecay" in s ? s.ticksToDecay || 0 : ROAD_DECAY_TIME))?.id;
}
