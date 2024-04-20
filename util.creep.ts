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
  if (role === "harvester" || role === "upgrader") {
    // harvesterのbody定義
    const bodiesDefinition: BodyPartConstant[] = [WORK, CARRY, MOVE];
    // 入れ物
    const bodies = [...bodiesDefinition];
    const getTotalCost = () =>
      _(bodies)
        .map((p) => BODYPART_COST[p])
        .sum();
    let cnt = 0;

    // cost以下かつ50個以下の間くっつける
    while (getTotalCost() <= cost && bodies.length <= 50) {
      bodies.push(bodiesDefinition[cnt++ % bodiesDefinition.length]);
    }

    // 1個分超えてるはずなので最後の１個を消して返す
    return bodies.slice(0, bodies.length - 1);
  } else {
    throw new Error("未実装");
  }
}
