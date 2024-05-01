/** 8近傍 */
export const neighborhoods = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

/** 現在地を渡すと近傍のRoomPositionを取得できる */
export const getNeighborhoods = (pos: RoomPosition | _HasRoomPosition) => {
  const p = "pos" in pos ? pos.pos : pos;

  return _(neighborhoods)
    .map(([dx, dy]) => {
      return Game.rooms[p.roomName]?.getPositionAt(p.x + dx, p.y + dy);
    })
    .compact();
};

export const RETURN_CODE_DECODER = Object.freeze({
  [OK.toString()]: "OK",
  [ERR_NOT_OWNER.toString()]: "ERR_NOT_OWNER",
  [ERR_NO_PATH.toString()]: "ERR_NO_PATH",
  [ERR_NAME_EXISTS.toString()]: "ERR_NAME_EXISTS",
  [ERR_BUSY.toString()]: "ERR_BUSY",
  [ERR_NOT_FOUND.toString()]: "ERR_NOT_FOUND",
  [ERR_NOT_ENOUGH_RESOURCES.toString()]: "ERR_NOT_ENOUGH",
  [ERR_INVALID_TARGET.toString()]: "ERR_INVALID_TARGET",
  [ERR_FULL.toString()]: "ERR_FULL",
  [ERR_NOT_IN_RANGE.toString()]: "ERR_NOT_IN_RANGE",
  [ERR_INVALID_ARGS.toString()]: "ERR_INVALID_ARGS",
  [ERR_TIRED.toString()]: "ERR_TIRED",
  [ERR_NO_BODYPART.toString()]: "ERR_NO_BODYPART",
  [ERR_RCL_NOT_ENOUGH.toString()]: "ERR_RCL_NOT_ENOUGH",
  [ERR_GCL_NOT_ENOUGH.toString()]: "ERR_GCL_NOT_ENOUGH",
});

export const DIRECTIONS: Record<DirectionConstant, [number, number]> = {
  [TOP_LEFT]: [-1, -1],
  [TOP]: [0, -1],
  [TOP_RIGHT]: [1, -1],
  [LEFT]: [-1, 0],
  [RIGHT]: [1, 0],
  [BOTTOM_LEFT]: [-1, 1],
  [BOTTOM]: [0, 1],
  [BOTTOM_RIGHT]: [1, 1],
};

export const BODY: Record<ROLES, BodyPartConstant[]> = Object.freeze({
  carrier: _.range(25)
    .map(() => [
      // 最低構成
      CARRY,
      MOVE,
    ])
    .flat(),
  harvester: [
    // 最低構成
    WORK,
    MOVE,
    CARRY,
    // 効率
    WORK,
    WORK,
    WORK,
    WORK,
    // 保持力
    ..._.range(43).map(() => CARRY),
  ],
  upgrader: _.range(17)
    .map(() => [
      // 最低構成
      CARRY,
      MOVE,
      WORK,
    ])
    .flat()
    .slice(0, 50),
});
