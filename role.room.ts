import { squareDiff } from "./util.creep";

export function roomBehavior(room: Room) {
  // Roomとしてやっておくこと

  // 今使えるソースspawnに近い順
  room.memory.activeSource = findActiceSourceOrderByPath(room);

  // エクステンション建てる
  creteExtensions(room);
}

/** 今使えるソースspawnに近い順 */
function findActiceSourceOrderByPath(room: Room) {
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
    .sortBy((source) => {
      const spawn = Object.entries(Game.spawns).find(
        ([_, spawn]) => spawn.room.name === room.name,
      );
      if (spawn) {
        return spawn[1].pos.findPathTo(source).length;
      } else {
        return 0;
      }
    })
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
      ...room.find(FIND_CONSTRUCTION_SITES),
      ...room.find(FIND_MY_STRUCTURES),
    ].filter((s) => s.structureType === STRUCTURE_EXTENSION);

    if (
      extensions.length <
      CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][room.controller.level]
    ) {
      for (const dist of _.range(2, 25, 2)) {
        for (const dy of _.range(-dist, dist + 1, 2)) {
          for (const dx of _.range(-dist, dist + 1, 2)) {
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
