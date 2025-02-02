import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove } from "./util.creep";
import { readonly } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isReserver(creep)) {
    return console.log(`${creep.name} is not Builder`);
  }
  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) => customMove(creep, target, opt);

  const memory = readonly(creep.memory);

  const targetRoom = Game.rooms[memory.targetRoomName] as Room | undefined;

  if (targetRoom) {
    if (creep.pos.roomName !== targetRoom.name) {
      return targetRoom.controller && moveMeTo(targetRoom.controller);
    }

    const damaged = _(Object.values(Game.creeps))
      .filter((c) => c.pos.roomName === targetRoom.name && c.hits < c.hitsMax)
      .value();

    // FIND_HOSTILE_XXXをぜんぶやる
    const hostiles = [...targetRoom.find(FIND_HOSTILE_CREEPS), ...targetRoom.find(FIND_HOSTILE_SPAWNS), ...targetRoom.find(FIND_HOSTILE_STRUCTURES)];

    if (damaged.length > 0 && creep.getActiveBodyparts(HEAL) > 0) {
      const target = creep.pos.findClosestByRange(damaged);
      if (target) {
        if (!creep.pos.isNearTo(target)) {
          moveMeTo(target);
        }
        _(creep.pos.isNearTo(target) ? creep.heal(target) : creep.rangedHeal(target))
          .tap((result) => {
            switch (result) {
              case ERR_NOT_IN_RANGE:
                moveMeTo(target);
                break;
              case OK:
                break;
              default:
                creep.say(RETURN_CODE_DECODER[result.toString()]);
                break;
            }
          })
          .run();
      }
    } else if (hostiles.length > 0 && creep.getActiveBodyparts(RANGED_ATTACK)) {
      // #region 敵がいる場合#################################################################
      const target = creep.pos.findClosestByRange(hostiles);
      if (target) {
        moveMeTo(target, {
          range: !("body" in target) || target.getActiveBodyparts(ATTACK) === 0 ? 0 : 3,
        });
        creep.rangedAttack(target);
      }
      // #endregion
    } else {
      // #region 敵がいないとき#################################################################
      if (targetRoom.controller) {
        // 射程内にいないときは近寄る
        if (!creep.pos.isNearTo(targetRoom.controller)) {
          moveMeTo(targetRoom.controller);
        }
        // 取られてるときは削る
        if (targetRoom.controller.reservation?.username !== "Nekane") {
          creep.attackController(targetRoom.controller);
        }
        // reserveする
        creep.reserveController(targetRoom.controller);
      }
      // #endregion
    }
  } else {
    // まだ部屋にいないとき
    const route =
      memory.route ||
      (creep.memory.route = Game.map.findRoute(creep.pos.roomName, memory.targetRoomName, {
        routeCallback(roomName) {
          const parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
          // 数値化した座標が10で割れるときはHighway
          const isHighway = parsed && (Number(parsed[1]) % 10 === 0 || Number(parsed[2]) % 10 === 0);
          const room = Game.rooms[roomName] as Room | undefined;
          // myが取れるときは自室
          const isMyRoom = room?.controller?.my;
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
      console.log("route not found", JSON.stringify(route));
      creep.memory.route = undefined;
      return;
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
    const moved = creep.memory.exit && moveMeTo(new RoomPosition(creep.memory.exit.x, creep.memory.exit.y, creep.memory.exit.roomName));
    if (moved !== OK) {
      const code = moved ? RETURN_CODE_DECODER[moved.toString()] : "no exit";
      console.log(`${creep.name}:${code}:${JSON.stringify(creep.memory.exit)}`);
      creep.say(code.replace("ERR_", ""));
      // OKじゃなかったらなんか変なので初期化する
      creep.memory.route = undefined;
      creep.memory.exit = undefined;
    }
  }
};

export default behavior;

function isReserver(creep: Creep): creep is Reserver {
  return creep.memory.role === "reserver";
}
