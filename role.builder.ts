import { findTransferTarget } from "./role.carrier";
import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, getRepairPower, moveRoom, pickUpAll, toColor, withdrawBy } from "./util.creep";
import { findMyStructures, getDecayAmount, getLabs, getSitesInRoom } from "./utils";
// import { findMyStructures } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isBuilder(creep)) {
    return console.log(`${creep.name} is not Builder`);
  }

  const mySite = _(Game.constructionSites)
    .values<ConstructionSite>()
    .filter((c) => c.room?.name === creep.memory.baseRoom)
    .run();

  // 自室の建設があるときはすぐ行く
  if (creep.pos.roomName !== creep.memory.baseRoom && mySite.length > 0) {
    return moveRoom(creep, creep.pos.roomName, creep.memory.baseRoom);
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
        return "gathering";
      }

      if (c.memory.mode === "gathering" && creep.store.energy >= CARRY_CAPACITY) {
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
      creep.memory.transferId = undefined;
      creep.say(creep.memory.mode);
    }
  };
  checkMode();

  const { road, rampart, container, link } = findMyStructures(creep.room);

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

    // 応急修理が要るものを探す
    if (!creep.memory.firstAidId) {
      creep.memory.firstAidId = _([...road, ...rampart, ...container])
        .filter((s: Structure) => {
          return s.hits <= getDecayAmount(s) * 10;
        })
        .sortBy((s) => s.hits / (getDecayAmount(s) * 10))
        .first()?.id;
    }

    // 応急修理する
    if (creep.memory.firstAidId) {
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

    //#endregion ###########################################################################################

    // #region エネルギー残量チェック ###########################################################################################

    // 建設以降の処理はエネルギーが十分溜まってるときだけやる
    if ((creep.room.storage ? creep.room.storage.store.energy : creep.room.energyAvailable) >= creep.room.energyCapacityAvailable) {
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
                  moveMeTo(site, { range: 3 });
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
                  return moveMeTo(target, { range: 3 });
                case OK:
                  // 成功したら同じ種類で近くの一番壊れてるやつにリタゲする
                  creep.memory.repairId = _(
                    creep.pos.findInRange(FIND_STRUCTURES, 4, { filter: (s) => s.structureType === target.structureType && s.hits < s.hitsMax }),
                  ).min((s) => s.hits)?.id;
                  return moveMeTo(target, { range: 3 });
                default:
                  return;
              }
            })
            .run();
        }
      }
      // #endregion
    } else {
      const preTarget = creep.memory.transferId && Game.getObjectById(creep.memory.transferId);
      if (
        !preTarget ||
        preTarget.structureType === STRUCTURE_STORAGE ||
        preTarget.structureType === STRUCTURE_TERMINAL ||
        preTarget.store.getFreeCapacity(RESOURCE_ENERGY) === 0
      ) {
        creep.memory.transferId = undefined;
      }

      const transferTarget = creep.memory.transferId ? Game.getObjectById(creep.memory.transferId) : findTransferTarget(creep.room);
      if (transferTarget) {
        // 離れていれば近寄る
        if (!creep.pos.isNearTo(transferTarget)) {
          moveMeTo(transferTarget, {
            ignoreCreeps: !creep.pos.inRangeTo(transferTarget, 2),
          });
        }
        if (transferTarget.structureType !== STRUCTURE_STORAGE) {
          creep.memory.transferId = transferTarget.id;
          creep.transfer(transferTarget, RESOURCE_ENERGY);
        }
      }
    }
    //#endregion ###########################################################################################
  } else {
    // 収集モードの時

    // #region エネルギー回収###########################################################################################
    const capacityThreshold = creep.room.controller ? EXTENSION_ENERGY_CAPACITY[creep.room.controller.level] : CARRY_CAPACITY;

    // 空のやつ初期化
    if (creep.memory.storeId && (Game.getObjectById(creep.memory.storeId)?.store.energy || 0) < capacityThreshold) {
      creep.memory.storeId = undefined;
    }

    // withdraw
    if (!creep.memory.storeId) {
      creep.memory.storeId = creep.pos.findClosestByRange(
        _.compact([
          ...container,
          ...link.filter((l) => !l.cooldown && l.store.energy),
          ...[creep.room.terminal, creep.room.storage].filter(
            (t) => t && t.store.energy > t.room.energyCapacityAvailable + creep.store.getCapacity(RESOURCE_ENERGY),
          ),
        ]),
        {
          filter: (s: StructureContainer | StructureLink) => {
            // いっぱいあるやつからだけ出す
            return s.store.energy >= capacityThreshold;
          },
        },
      )?.id;
    }

    creep.memory.storeId = creep.memory.storeId || creep.room.storage?.id;

    if (!creep.memory.storeId && container.filter((c) => c.store.energy > 0).length === 0) {
      const source = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
      if (source) {
        if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
          moveMeTo(source);
        }
        return;
      }
    }

    const store = creep.memory.storeId && Game.getObjectById(creep.memory.storeId);
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
    // #endregion
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

function isBoosted(creep: Builder) {
  // いずれかがboots無しでない
  return creep.body.filter((b) => b.type === WORK).every((b) => b.boost !== undefined);
}

function boost(creep: Builder) {
  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) =>
    customMove(creep, target, {
      ...opt,
    });

  const labs = getLabs(creep.room);

  // 優先順でマッピングを作る
  const lab = boosts
    .map((mineralType) => {
      return {
        lab: labs.find((l) => l.mineralType === mineralType && l.store[l.mineralType] >= LAB_BOOST_MINERAL && l.store.energy >= LAB_BOOST_ENERGY),
        mineralType,
      };
    })
    // labが見つかった最初のやつを取り出す
    .find((l) => l.lab)?.lab;

  if (lab) {
    if (creep.pos.isNearTo(lab)) {
      return lab.boostCreep(creep);
    } else {
      return moveMeTo(lab);
    }
  } else {
    return null;
  }
}

//#region findBuildTarget
function findBuildTarget(creep: Builder) {
  return _(getSitesInRoom(Game.rooms[creep.memory.baseRoom]))
    .sortBy((s) => {
      // 最大サイズharvesterが確保できてるとき

      // 優先順位
      const getPriority = (): number => {
        if (creep.room.energyCapacityAvailable > 600) {
          const priority: StructureConstant[] = [
            // 壁は急ぐ
            STRUCTURE_RAMPART,
            STRUCTURE_WALL,
            // とりあえず輸送
            STRUCTURE_ROAD,
            // 防衛
            STRUCTURE_TOWER,
            // 輸送
            STRUCTURE_LINK,
            // 貯蔵
            STRUCTURE_STORAGE,
            // LAB
            STRUCTURE_TERMINAL,
            STRUCTURE_LAB,
          ];

          const idx = priority.findIndex((c) => c === s.structureType);
          // 残作業量に(距離+1)をかけたやつを優先
          if (idx >= 0) {
            return idx;
          } else {
            return priority.length;
          }
        } else {
          return 0;
        }
      };
      return getPriority() * 1000000 + (s.progressTotal - s.progress) * (s.pos.getRangeTo(creep) + 1);
    })
    .first()?.id;
}
//#endregion

function findRepairTarget(creep: Builder) {
  return _(
    creep.room.find(FIND_STRUCTURES, {
      // ダメージのある建物
      filter: (s) => {
        // 閾値
        return s.hits < s.hitsMax - getRepairPower(creep);
      },
    }),
  )
    .sortBy((s) => s.hits * ROAD_DECAY_TIME + ("ticksToDecay" in s ? s.ticksToDecay || 0 : ROAD_DECAY_TIME))
    .first()?.id;
}
