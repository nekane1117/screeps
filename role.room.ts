import { squareDiff } from "./util.creep";

export function roomBehavior(room: Room) {
  // Roomとしてやっておくこと
  room.memory.activeSource = room
    .find(FIND_SOURCES_ACTIVE, {
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
    })
    .map((s) => s.id);
}
