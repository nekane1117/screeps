import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, filterBodiesByCost, getCreepsInRoom, pickUpAll, squareDiff } from "./util.creep";
import { findMyStructures, getCapacityRate, getSitesInRoom, getSpawnsInRoom, isHighway, logUsage, readonly } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isRemoteHarvester(creep)) {
    return console.log(`${creep.name} is not RemoteHarvester`);
  }
  const memory = readonly(creep.memory);

  const checkMode = () => {
    const newMode: RemoteHarvesterMemory["mode"] = ((creep: RemoteHarvester) => {
      if (creep.memory.mode === "👷" && (getSitesInRoom(creep.room).length === 0 || creep.store.energy < creep.getActiveBodyparts(WORK) * BUILD_POWER)) {
        return "🌾";
      } else if (creep.store.energy === 0) {
        // 空になってたらとにかく収穫する
        return "🌾";
      } else if (memory.mode === "🌾" && getCapacityRate(creep) === 1) {
        // 満タンの時は輸送モードになる
        return "🚛";
      } else {
        // それ以外はそのまま
        return memory.mode;
      }
    })(creep);
    if (memory.mode !== newMode) {
      creep.say(newMode);
      creep.memory.mode = newMode;
      creep.memory.route = undefined;
      creep.memory.siteId = undefined;
      creep.memory.storeId = undefined;
    }
  };
  checkMode();

  // 防衛
  const hostiles = creep.room.find(FIND_HOSTILE_CREEPS);
  const inverderCodre = creep.room.find(FIND_HOSTILE_STRUCTURES, { filter: (s): s is StructureInvaderCore => s.structureType === STRUCTURE_INVADER_CORE });
  const enemy = creep.pos.findClosestByRange(_.compact([...hostiles, ...inverderCodre]));
  if (enemy) {
    const defenders = getCreepsInRoom(creep.room).defender || [];
    if (defenders.length === 0) {
      const baseRoom = Game.rooms[memory.baseRoom];
      if (baseRoom && baseRoom.energyAvailable === baseRoom.energyCapacityAvailable) {
        const spawn = getSpawnsInRoom(baseRoom).find((s) => !s.spawning);
        if (spawn) {
          spawn.spawnCreep(filterBodiesByCost("defender", baseRoom.energyAvailable).bodies, `D_${creep.room.name}_${Game.time}`, {
            memory: {
              role: "defender",
              baseRoom: memory.targetRoomName,
              targetId: enemy.id,
            } as DefenderMemory,
          });
        }
      }
    }
  }

  // harvest
  harvest(creep);

  // 建設がなく道じゃないところを歩いてるときは道を敷く
  if (
    creep.memory.mode === "🚛" &&
    creep.pos.roomName !== creep.memory.baseRoom &&
    getSitesInRoom(creep.room).length === 0 &&
    !isHighway(creep.room) &&
    !creep.pos.lookFor(LOOK_STRUCTURES).find((s) => s.structureType === STRUCTURE_ROAD)
  ) {
    // 現在地に道が無ければ作らせる
    creep.pos.createConstructionSite(STRUCTURE_ROAD);
  }
  // build
  build(creep);
  // repair
  const repariTarget = creep.pos.roomName !== memory.baseRoom && creep.pos.lookFor(LOOK_STRUCTURES).find((s) => s.hits < s.hitsMax);
  if (repariTarget) {
    creep.repair(repariTarget);
  }
  // heal
  const healTarget = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: (c) => {
      return c.hits < c.hitsMax && creep.pos.inRangeTo(c, 3);
    },
  });
  if (healTarget) {
    if (creep.pos.isNearTo(healTarget)) {
      creep.heal(healTarget);
    } else {
      creep.rangedHeal(healTarget);
    }
  }

  // withdraw
  pickUpAll(creep);

  // transfer
  transfer(creep);
};

export default behavior;

function isRemoteHarvester(creep: Creep): creep is RemoteHarvester {
  return creep.memory.role === "remoteHarvester";
}

function harvest(creep: RemoteHarvester) {
  const memory = readonly(creep.memory);
  const targetRoom = Game.rooms[memory.targetRoomName] as Room | undefined;
  const { remoteHarvester = [] } = getCreepsInRoom(creep.room);
  // 部屋が取れるか
  if (targetRoom) {
    // FIND_HOSTILE_XXXをぜんぶやる
    const hostiles = [...targetRoom.find(FIND_HOSTILE_CREEPS), ...targetRoom.find(FIND_HOSTILE_SPAWNS), ...targetRoom.find(FIND_HOSTILE_STRUCTURES)];
    if (hostiles.length > 0 && creep.getActiveBodyparts(ATTACK)) {
      // #region 敵がいる場合#################################################################
      const target = creep.pos.findClosestByPath(hostiles) || _(hostiles).first();
      if (target) {
        customMove(creep, target, {
          range: !("body" in target) || target.getActiveBodyparts(ATTACK) === 0 ? 0 : 3,
        });
        creep.rangedAttack(target);
        creep.attack(target);
      }
      // #endregion
    } else {
      // #region 敵がいないとき#################################################################
      if (memory.harvestTargetId) {
        // 上手く取れないときだけ初期化する
        if (!Game.getObjectById(memory.harvestTargetId)) {
          creep.memory.harvestTargetId = undefined;
        }
      }
      if (!memory.harvestTargetId) {
        // イイ感じのSourceを取得する
        creep.memory.harvestTargetId = _(
          targetRoom.find(FIND_SOURCES, {
            filter: (s) => {
              // ８近傍で壁じゃないマス > このsourceを指定してるcreep
              return (
                squareDiff.filter(([dx, dy]) => {
                  const pos = s.room.getPositionAt(s.pos.x + dx, s.pos.y + dy);
                  if (!pos) {
                    return false;
                  }
                  // 壁でなくてcreepが居ない場所
                  return s.room.getTerrain().get(pos.x, pos.y) !== TERRAIN_MASK_WALL;
                }).length > remoteHarvester.filter((c) => c.memory.harvestTargetId === s.id).length
              );
            },
          }) || [],
        )
          .sort((s1, s2) => {
            const getPriority = (s: Source) => {
              if (s.energy > 0) {
                // エネルギーがあるやつは近い順
                return s.pos.getRangeTo(creep);
              } else {
                // 再生までの時間順
                // (最大容量を固定で足して,エネルギーがあるやつより後ろに行くようにする)
                return SOURCE_ENERGY_CAPACITY + s.ticksToRegeneration;
              }
            };
            return getPriority(s1) - getPriority(s2);
          })
          .first()?.id;
        // それでもないときは無いはずだけど終わる
      }
      const source = memory.harvestTargetId && Game.getObjectById(memory.harvestTargetId);
      if (!source || source.pos.roomName !== memory.targetRoomName) {
        // id,本体が見つからないときは初期化して終わる
        creep.memory.harvestTargetId = undefined;
        return ERR_NOT_FOUND;
      }

      // モードが何であれ収穫は叩く
      switch ((creep.memory.worked = creep.harvest(source))) {
        // OKはいい
        case OK:
          _(
            creep.pos.findInRange(FIND_MY_CREEPS, 1, {
              filter: (c) => {
                return c.memory.role === "remoteHarvester" && (c.pos.x < creep.pos.x || c.pos.y < creep.pos.y);
              },
            }),
          )
            .tap((neighbors) => {
              const c = _(neighbors).first();
              if (c) {
                creep.transfer(c, RESOURCE_ENERGY);
              }
            })
            .run();

          return OK;
        // 範囲内に無いときは収穫モードの時だけ近寄る
        case ERR_NOT_IN_RANGE:
          if (memory.mode === "🌾") {
            // 範囲内でなくて収穫モードの時は近寄る

            // 自室以外の時は障害物を壊す
            if (creep.room.name !== creep.memory.baseRoom) {
              const moveing = _(memory._move?.path || []).first();
              const isInRange = (n: number) => {
                return 0 < n && n < 49;
              };

              const blocker =
                moveing &&
                isInRange(creep.pos.x + moveing.dx) &&
                isInRange(creep.pos.y + moveing.dy) &&
                creep.room
                  .lookForAt(LOOK_STRUCTURES, creep.pos.x + moveing.dx, creep.pos.y + moveing.dy)
                  .find((s) => (OBSTACLE_OBJECT_TYPES as StructureConstant[]).includes(s.structureType));
              if (blocker) {
                creep.dismantle(blocker);
              }
            }
            return customMove(creep, source, {
              // 所有者が居ない部屋では壁とかも無視して突っ切る
              ignoreDestructibleStructures: !creep.room.controller?.owner?.username,
            });
          } else {
            return memory.worked;
          }

        // それ以外の時は対象を初期化して終わる
        default:
          creep.memory.harvestTargetId = undefined;
          return;
      }
      // #endregion
    }
  } else {
    // 部屋が取れないとき
    if (memory.mode === "🌾") {
      // 収穫モードの時は向かう
      return moveRoom(creep, creep.pos.roomName, memory.targetRoomName);
    } else {
      // モードが違うときは何もしなくていい
      return OK;
    }
  }
}

function build(creep: RemoteHarvester) {
  const memory = readonly(creep.memory);

  if (creep.pos.roomName === creep.memory.baseRoom) {
    if (creep.memory.mode === "👷") {
      creep.memory.mode = "🌾";
      creep.memory.route = undefined;
      creep.memory.siteId = undefined;
      creep.memory.storeId = undefined;
    }
    return OK;
  }
  const sitesInroom = getSitesInRoom(creep.pos.roomName);

  // 運搬モードで建設予定地があるときは建設モードに切り替える
  if (memory.mode === "🚛" && sitesInroom.length > 0) {
    creep.memory.mode = "👷";
    creep.memory.siteId = undefined;
    creep.say(creep.memory.mode);
  }
  if (creep.store.energy < creep.getActiveBodyparts(WORK) * BUILD_POWER) {
    return ERR_NOT_ENOUGH_ENERGY;
  }

  // 最寄りの現場を探す
  if (!memory.siteId) {
    creep.memory.siteId = creep.pos.findClosestByPath(sitesInroom, { maxRooms: 0 })?.id;
  }
  const site = memory.siteId && Game.getObjectById(memory.siteId);
  if (!site) {
    // 建設現場が見つからないときは初期化して終わる
    creep.memory.siteId = undefined;
    return ERR_NOT_FOUND;
  }
  // 上に乗るまで移動する
  if (memory.mode === "👷" && creep.pos.getRangeTo(site) > 0) {
    customMove(creep, site, {
      // 所有者が居ない部屋では壁とかも無視して突っ切る
      ignoreDestructibleStructures: !creep.room.controller?.owner?.username,
    });
  }
  //
  return (creep.memory.worked = creep.build(site));
}

function moveRoom(creep: RemoteHarvester, fromRoom: string, toRoom: string) {
  const memory = readonly(creep.memory);

  const route =
    memory.route ||
    (creep.memory.route = Game.map.findRoute(fromRoom, toRoom, {
      routeCallback(roomName) {
        const parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
        // 数値化した座標が10で割れるときはHighway
        const isHighway = parsed && (Number(parsed[1]) % 10 === 0 || Number(parsed[2]) % 10 === 0);
        // myが取れるときは自室
        const isMyRoom = Game.rooms[roomName] && Game.rooms[roomName].controller && Game.rooms[roomName].controller?.my;
        // 自室か高速道路を通る
        if (isHighway || isMyRoom) {
          return 1;
        } else {
          // それ以外は遠回り
          return 2.5;
        }
      },
    }));
  if (!Array.isArray(route)) {
    // パスが見つからないときは初期化して終わる
    creep.memory.route = undefined;
    return route;
  }

  const current = route[route.findIndex((r) => r.room === creep.pos.roomName) + 1];
  if (!current) {
    // 現在地が見つからないのもおかしいので初期化して終わる
    creep.memory.route = undefined;
    return;
  }

  // 向かう先を指定する
  if (memory.exit?.roomName !== creep.pos.roomName) {
    creep.memory.exit = creep.pos.findClosestByPath(current.exit);
  }

  // 移動してみる
  const moved = creep.memory.exit && customMove(creep, new RoomPosition(creep.memory.exit.x, creep.memory.exit.y, creep.memory.exit.roomName));
  if (moved !== OK) {
    const code = moved ? RETURN_CODE_DECODER[moved.toString()] : "no exit";
    console.log(`${creep.name}:${code}`);
    creep.say(code.replace("ERR_", ""));
    // OKじゃなかったらなんか変なので初期化する
    creep.memory.route = undefined;
    creep.memory.exit = undefined;
  }
  return moved;
}

function transfer(creep: RemoteHarvester) {
  const memory = readonly(creep.memory);

  const baseRoom = Game.rooms[memory.baseRoom];
  if (baseRoom) {
    // 指定の倉庫が満タンの場合は消す
    if (memory.storeId && Game.getObjectById(memory.storeId)?.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      creep.memory.storeId = undefined;
    }

    // 自室の倉庫を取得する
    const { container, spawn, extension, storage, link, terminal } = findMyStructures(baseRoom);

    // ミネラル用のコンテナには入れたくないので除外しておく
    const filtedContainers = container.filter((s) => s.pos.findInRange(FIND_MINERALS, 3).length === 0);
    if (!memory.storeId) {
      // イイ感じの倉庫を取得する
      creep.memory.storeId = logUsage("search remote container", () => {
        const targets = [...filtedContainers, ...spawn, ...extension, ...storage, ...link, ...terminal].filter(
          (s) => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
        );

        const result = PathFinder.search(
          creep.pos,
          targets.map((p) => p.pos),
          {
            plainCost: 2,
            swampCost: 10,
          },
        );
        // 失敗時は失敗を返す
        if (result.incomplete) {
          return undefined;
        }

        const goal = _(result.path).last();
        return targets.find((t) => {
          return t.pos.x === goal.x && t.pos.y === goal.y && t.pos.roomName === goal.roomName;
        });
      })?.id;
      // それでもないときは無いはずだけど終わる
    }

    const store = memory.storeId && Game.getObjectById(memory.storeId);
    if (!store || store.pos.roomName !== memory.baseRoom) {
      // id,本体が見つからないときは初期化して終わる
      creep.memory.storeId = undefined;
      return ERR_NOT_FOUND;
    }

    (Object.keys(creep.store) as ResourceConstant[]).forEach((resourceType) => {
      if ((creep.memory.worked = creep.transfer(store, resourceType)) === ERR_NOT_IN_RANGE && memory.mode === "🚛") {
        // 範囲内でなくて収集モードの時は近寄る
        return customMove(creep, store);
      } else {
        return creep.memory.worked;
      }
    });
  } else {
    // 自室にいないとき
    if (memory.mode === "🚛") {
      // 収穫モードの時は向かう
      return moveRoom(creep, creep.pos.roomName, memory.baseRoom);
    } else {
      // モードが違うときは何もしなくていい
      return OK;
    }
  }
}
