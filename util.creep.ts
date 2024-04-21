export function isStoreTarget(x: Structure): x is StoreTarget {
  return [
    STRUCTURE_CONTAINER,
    STRUCTURE_SPAWN,
    STRUCTURE_EXTENSION,
    STRUCTURE_STORAGE,
    STRUCTURE_LINK,
  ].some((t) => t === x.structureType);
}

export const squareDiff = Object.freeze([
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
] as [number, number][]);

export function bodyMaker(role: ROLES, cost: number): BodyPartConstant[] {
  // 入れ物
  const bodies = [...MIN_BODY[role]];
  const getTotalCost = () =>
    _(bodies)
      .map((p) => BODYPART_COST[p])
      .sum();
  let cnt = 0;

  // cost以下かつ50個以下の間くっつける
  while (getTotalCost() <= cost && bodies.length <= 50) {
    bodies.push(MIN_BODY[role][cnt++ % MIN_BODY[role].length]);
  }

  // 1個分超えてるはずなので最後の１個を消して返す
  return bodies.slice(0, bodies.length - 1);
}

export function randomWalk(creep: Creep) {
  const directions = [
    TOP_LEFT,
    TOP,
    TOP_RIGHT,
    LEFT,
    RIGHT,
    BOTTOM_LEFT,
    BOTTOM,
    BOTTOM_RIGHT,
  ];
  return creep.move(directions[_.random(0, directions.length - 1)]);
}

export const MIN_BODY: Record<ROLES, BodyPartConstant[]> = Object.freeze({
  builder: [WORK, CARRY, MOVE],
  carrier: [WORK, CARRY, MOVE],
  defender: [],
  harvester: [WORK, CARRY, MOVE],
  repairer: [WORK, CARRY, MOVE],
  upgrader: [WORK, CARRY, MOVE],
});

export const getBodyCost = (bodies: BodyPartConstant[]) =>
  _(bodies)
    .map((p) => BODYPART_COST[p])
    .sum();

export const RETURN_CODE_DECODER = Object.freeze({
  [OK]: "OK",
  [ERR_NOT_OWNER]: "ERR_NOT_OWNER",
  [ERR_NO_PATH]: "ERR_NO_PATH",
  [ERR_NAME_EXISTS]: "ERR_NAME_EXISTS",
  [ERR_BUSY]: "ERR_BUSY",
  [ERR_NOT_FOUND]: "ERR_NOT_FOUND",
  [ERR_NOT_ENOUGH_RESOURCES]: "ERR_NOT_ENOUGH",
  [ERR_INVALID_TARGET]: "ERR_INVALID_TARGET",
  [ERR_FULL]: "ERR_FULL",
  [ERR_NOT_IN_RANGE]: "ERR_NOT_IN_RANGE",
  [ERR_INVALID_ARGS]: "ERR_INVALID_ARGS",
  [ERR_TIRED]: "ERR_TIRED",
  [ERR_NO_BODYPART]: "ERR_NO_BODYPART",
  [ERR_RCL_NOT_ENOUGH]: "ERR_RCL_NOT_ENOUGH",
  [ERR_GCL_NOT_ENOUGH]: "ERR_GCL_NOT_ENOUGH",
});
