import { squareDiff } from "./util.creep";

export function roomBehavior(room: Room) {
  // Roomとしてやっておくこと
  room.memory.activeSource = _(
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
