import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove } from "./util.creep";
import { readonly } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isReserver(creep)) {
    return console.log(`${creep.name} is not Builder`);
  }
  const moveMeTo = (target: RoomPosition | _HasRoomPosition) =>
    customMove(creep, target, {
      ignoreCreeps: !creep.pos.inRangeTo(target, 2),
    });

  const memory = readonly(creep.memory);

  // 到達済みか
  if (creep.pos.roomName === memory.targetRoomName) {
    // 既にreserve済みか
    if (creep.room.controller?.my) {
      return creep.say("reserved");
    }

    // reserveする
    if (creep.room.controller && creep.reserveController(creep.room.controller) === ERR_NOT_IN_RANGE) {
      moveMeTo(creep.room.controller);
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
