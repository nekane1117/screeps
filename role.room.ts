import { getSpawnNamesInRoom, squareDiff } from "./util.creep";

export function roomBehavior(room: Room) {
  // Roomとしてやっておくこと

  // 今使えるソース
  room.memory.activeSource = findActiceSource(room);

  if (!room.memory.roadLayed || Game.time - room.memory.roadLayed > 5000) {
    console.log("roadLayer in " + Game.time);
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
  _(getSpawnNamesInRoom(room).map((name) => Game.spawns[name]))
    .compact()
    .value()
    .forEach((spawn) => {
      return [
        ...room.find(FIND_SOURCES),
        ...room.find(FIND_MY_STRUCTURES, {
          filter: (s) => s.structureType === STRUCTURE_CONTROLLER,
        }),
      ].forEach((source) => {
        room
          .findPath(spawn.pos, source.pos, {
            ignoreCreeps: true,
            swampCost: 1,
            // これから道を引く予定のところは1にする
            costCallback: (roomName, matrix) => {
              _.range(50).forEach((x) => {
                _.range(50).forEach((y) => {
                  if (
                    room
                      .lookForAt(LOOK_CONSTRUCTION_SITES, x, y)
                      .some((site) => site.structureType === STRUCTURE_ROAD)
                  ) {
                    matrix.set(x, y, 1);
                  }
                });
              });
            },
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
  room.memory.roadLayed = Game.time;
}
