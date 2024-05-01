import { getNeighborhoods } from "./constants";

export default function behavior(room: Room) {
  // 部屋ごとの動きやroomのメモリの初期化

  // Sourceの情報を先に作っておく
  // 一応適当に500tickごとにチェックし直す
  if (!room.memory.sources || Game.time % 500) {
    const terrain = room.getTerrain();
    room.memory.sources = room.find(FIND_SOURCES).map((s) => {
      return {
        spaces: getNeighborhoods(s)
          .map((p) => (terrain.get(p.x, p.y) !== TERRAIN_MASK_WALL ? 1 : 0))
          .sum(),
      };
    });
  }
}
