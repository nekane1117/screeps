import { getNeighborhoods } from "./constants";
import { ObjectKeys } from "./utils";
import sourceBehavior from "./source";
export default function behavior(room: Room) {
  // 部屋ごとの動きやroomのメモリの初期化

  // Sourceの情報を先に作っておく
  // 一応適当に500tickごとにチェックし直す
  if (!room.memory.sources || Game.time % 500) {
    const terrain = room.getTerrain();
    room.memory.sources = room.find(FIND_SOURCES).reduce(
      (sources, s) => {
        return {
          ...sources,
          [s.id]: {
            spaces: getNeighborhoods(s)
              .map((p) => (terrain.get(p.x, p.y) !== TERRAIN_MASK_WALL ? 1 : 0))
              .sum(),
          },
        };
      },
      {} as Record<Id<Source>, SourceInfo>,
    );
  }

  // sourceの動き
  _(ObjectKeys(room.memory.sources))
    .map((s) => Game.getObjectById(s))
    .compact()
    .map(sourceBehavior)
    .run();
}
