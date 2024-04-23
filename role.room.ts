import { getSpawnsInRoom, squareDiff } from "./util.creep";

export function roomBehavior(room: Room) {
  // Roomとしてやっておくこと

  // 今使えるソース
  room.memory.activeSource = findActiceSource(room);

  if (
    !room.memory.roadLayed ||
    Game.time - room.memory.roadLayed > (room.name === "sim" ? 100 : 5000)
  ) {
    console.log("roadLayer");
    roadLayer(room);
  }

  // エクステンション建てる
  creteExtensions(room);
}

/** 今使えるソース */
function findActiceSource(room: Room) {
  return _(
    room.find(FIND_SOURCES_ACTIVE, {
      filter: (s) => {
        return !!_(squareDiff)
          // 8近傍の位置を取得する
          .map(([dx, dy]: [number, number]) => {
            return room.getPositionAt(s.pos.x + dx, s.pos.y + dy);
          })
          .compact()
          // 壁以外かつcreepのいないマス
          .filter(
            (pos: RoomPosition) =>
              pos.lookFor(LOOK_TERRAIN)[0] !== "wall" &&
              !pos.lookFor(LOOK_CREEPS).length,
          )
          // がある
          .size();
      },
    }),
  )
    .map((s) => s.id)
    .value();
}

/** エクステンション建てる */
function creteExtensions(room: Room) {
  const spawn = Object.entries(Game.spawns).find(
    ([_, s]) => s.room.name === room.name,
  )?.[1];
  if (room.controller && spawn) {
    const extensions = [
      ...room.find(FIND_MY_CONSTRUCTION_SITES),
      ...room.find(FIND_MY_STRUCTURES),
    ].filter((s) => s.structureType === STRUCTURE_EXTENSION);

    if (
      extensions.length <
      CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][room.controller.level]
    ) {
      for (const dist of _.range(1, 25)) {
        for (const dy of _.range(-dist, dist + 1)) {
          for (const dx of _.range(-dist, dist + 1)) {
            if (Math.abs(dx) + Math.abs(dy) === dist && (dx + dy) % 2 === 0) {
              if (
                room.createConstructionSite(
                  spawn.pos.x + dx,
                  spawn.pos.y + dy,
                  STRUCTURE_EXTENSION,
                ) === OK
              ) {
                // つくれた場合抜ける
                return;
              }
            }
          }
        }
      }
    }
  }
}

// 全てのspawnからsourceまでの道を引く
function roadLayer(room: Room) {
  _(getSpawnsInRoom(room).map((name) => Game.spawns[name]))
    .compact()
    .value()
    .forEach((spawn) => {
      return room.find(FIND_SOURCES).forEach((source) => {
        room
          .findPath(spawn.pos, source.pos, {
            ignoreCreeps: true,
            swampCost: 1,
          })
          .map((path) => {
            // そこに道が無ければ敷く
            const pos = room.getPositionAt(path.x, path.y);
            return (
              !pos?.lookFor(LOOK_TERRAIN).some((t) => t === "wall") &&
              !pos
                ?.lookFor(LOOK_STRUCTURES)
                .some((s) => s.structureType === STRUCTURE_ROAD) &&
              room.createConstructionSite(path.x, path.y, STRUCTURE_ROAD)
            );
          });
      });
    });
  console.log(Game.time);
  room.memory.roadLayed = Game.time;
}
