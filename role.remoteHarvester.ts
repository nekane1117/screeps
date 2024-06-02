import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, getMainSpawn, pickUpAll } from "./util.creep";
import { findMyStructures, getCapacityRate, getSitesInRoom, readonly } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isRemoteHarvester(creep)) {
    return console.log(`${creep.name} is not Builder`);
  }
  const memory = readonly(creep.memory);

  const checkMode = () => {
    const newMode: RemoteHarvesterMemory["mode"] = ((creep: RemoteHarvester) => {
      if (creep.store.energy === 0) {
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
      creep.memory.harvestTargetId = undefined;
      creep.memory.siteId = undefined;
      creep.memory.storeId = undefined;
    }
  };
  checkMode();

  // harvest
  harvest(creep);
  // attack
  // ATTACKパーツは何もしなくても自動で反撃するのでそっちに任せる
  // 範囲攻撃されると手も足も出ない
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
  if (creep.pos.roomName === memory.targetRoomName) {
    // 部屋に居るとき
    if (!memory.harvestTargetId) {
      // イイ感じのSourceを取得する
      creep.memory.harvestTargetId = _(creep.room.find(FIND_SOURCES) || [])
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
    if (!source || source.energy === 0 || source.pos.roomName !== memory.targetRoomName) {
      // id,本体が見つからないときは初期化して終わる
      creep.memory.harvestTargetId = undefined;
      return ERR_NOT_FOUND;
    }

    // モードが何であれ収穫は叩く
    if ((creep.memory.worked = creep.harvest(source)) === ERR_NOT_IN_RANGE && memory.mode === "🌾") {
      // 範囲内でなくて収穫モードの時は近寄る
      const moveing = _(memory._move?.path || []).first();
      const blocker =
        moveing &&
        creep.room
          .lookForAt(LOOK_STRUCTURES, creep.pos.x + moveing.dx, creep.pos.y + moveing.dy)
          .find((s) => (OBSTACLE_OBJECT_TYPES as StructureConstant[]).includes(s.structureType));
      if (blocker) {
        if (creep.dismantle(blocker) !== OK) {
          creep.attack(blocker);
        }
      }

      return customMove(creep, source, {
        // 所有者が居ない部屋では壁とかも無視して突っ切る
        ignoreDestructibleStructures: !creep.room.controller?.owner?.username,
      });
    } else {
      return creep.memory.worked;
    }
  } else {
    // remote部屋にいないとき
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

  const sitesInroom = getSitesInRoom(creep.pos.roomName);

  // 自室じゃない
  // 収穫対象が設定されている
  // 建設現場が１つも無い
  // 道じゃないところを歩いている
  // のときsourceからの道を引く
  if (
    creep.pos.roomName !== memory.baseRoom &&
    memory.harvestTargetId &&
    Object.values(Game.constructionSites).length === 0 &&
    !creep.pos.lookFor(LOOK_STRUCTURES).find((s) => s.structureType === STRUCTURE_ROAD) &&
    !creep.pos.lookFor(LOOK_CONSTRUCTION_SITES).find((s) => s.structureType === STRUCTURE_ROAD)
  ) {
    const spawn = Game.rooms[memory.baseRoom] && getMainSpawn(Game.rooms[memory.baseRoom]);
    const source = Game.getObjectById(memory.harvestTargetId);
    if (spawn && source) {
      // 通る部屋を計算する
      const route = Game.map.findRoute(source.pos.roomName, spawn.pos.roomName, {
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
      });
      // パスが見つからないときはどうしようもないので終わる
      if (!Array.isArray(route)) {
        return console.log("no Construction route");
      }

      // 部屋名を確保
      const allowedRoom = route.reduce(
        (allowedRoom, { room }) => {
          allowedRoom[room] = true;
          return allowedRoom;
        },
        {
          [creep.pos.roomName]: true,
          [memory.baseRoom]: true,
        } as Partial<Record<string, boolean>>,
      );
      console.log("try construction", JSON.stringify(allowedRoom));

      PathFinder.search(source.pos, spawn.pos, {
        // 道を敷くので全部無視する
        plainCost: 1,
        swampCost: 1,

        roomCallback(roomName) {
          // 許可した部屋だけを通る
          if (allowedRoom[roomName] === undefined) {
            return false;
          } else {
            const room = Game.rooms[roomName];
            if (!room) return false;
            const costs = new PathFinder.CostMatrix();
            // 壁以外は全部2
            _.range(50).forEach((x) => {
              _.range(50).forEach((y) => {
                if (room.lookForAt(LOOK_TERRAIN, x, y)?.[0] !== "wall") {
                  costs.set(x, y, 2);
                }
              });
            });

            // 道と道になる予定のところは1
            [...room.find(FIND_STRUCTURES), ...room.find(FIND_MY_CONSTRUCTION_SITES)].forEach((s) => {
              if (s.structureType === STRUCTURE_ROAD) {
                costs.set(s.pos.x, s.pos.y, 2);
              }
            });

            // 通り抜けできないオブジェクトをよける
            room
              .find(FIND_STRUCTURES, {
                filter: (s) => {
                  return (OBSTACLE_OBJECT_TYPES as StructureConstant[]).includes(s.structureType);
                },
              })
              .forEach(function (obstacle) {
                costs.set(obstacle.pos.x, obstacle.pos.y, 0xff);
              });

            return costs;
          }
        },
      }).path.map((p) => p.createConstructionSite(STRUCTURE_ROAD));
    } else {
      console.log("missing", JSON.stringify({ spawn, source }));
    }
  }

  // 運搬モードで自室以外で建設予定地があるときは建設モードに切り替える
  if (memory.mode === "🚛" && creep.pos.roomName !== memory.baseRoom && sitesInroom.length > 0) {
    creep.memory.mode = "👷";
    creep.say(creep.memory.mode);
  }
  // 最寄りの現場を探す
  if (!memory.siteId) {
    creep.memory.siteId = creep.pos.findClosestByPath(sitesInroom)?.id;
  }

  const site = memory.siteId && Game.getObjectById(memory.siteId);
  if (!site) {
    // 建設現場が見つからないときは初期化して終わる
    creep.memory.siteId = undefined;
    return ERR_NOT_FOUND;
  }
  if (creep.store.energy >= creep.getActiveBodyparts(WORK) * BUILD_POWER) {
    if ((creep.memory.worked = creep.build(site)) === ERR_NOT_IN_RANGE && memory.mode === "👷") {
      return customMove(creep, site, {
        // 所有者が居ない部屋では壁とかも無視して突っ切る
        ignoreDestructibleStructures: !creep.room.controller?.owner?.username,
      });
    } else {
      return creep.memory.worked;
    }
  } else {
    //エネルギーが足らなくなったら収穫モードに戻す
    creep.say("🌾");
    creep.memory.mode = "🌾";
    creep.memory.harvestTargetId = undefined;
  }
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

  if (creep.pos.roomName === memory.baseRoom) {
    const { container, spawn, extension, storage, link, terminal } = findMyStructures(creep.room);
    // 倉庫が満タンの場合は消す
    if (memory.storeId && Game.getObjectById(memory.storeId)?.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      creep.memory.siteId = undefined;
    }

    if (!memory.storeId) {
      // イイ感じの倉庫を取得する
      creep.memory.storeId = creep.pos.findClosestByPath(
        [...container, ...spawn, ...extension, ...storage, ...link, ...terminal].filter((s) => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0),
      )?.id;
      // それでもないときは無いはずだけど終わる
    }

    const store = memory.storeId && Game.getObjectById(memory.storeId);
    if (!store || store.pos.roomName !== memory.baseRoom) {
      // id,本体が見つからないときは初期化して終わる
      creep.memory.harvestTargetId = undefined;
      return ERR_NOT_FOUND;
    }

    // モードが何であれ収穫は叩く
    (Object.keys(creep.store) as ResourceConstant[]).forEach((resourceType) => {
      if ((creep.memory.worked = creep.transfer(store, resourceType)) === ERR_NOT_IN_RANGE && memory.mode === "🚛") {
        // 範囲内でなくて収穫モードの時は近寄る
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
