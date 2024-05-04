export function isStoreTarget(x: Structure): x is StoreTarget {
  return [STRUCTURE_CONTAINER, STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_STORAGE, STRUCTURE_LINK].some((t) => t === x.structureType);
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
  if (role === "harvester") {
    return HARVESTER_BODY.reduce(
      (bodies, parts) => {
        const total = _.last(bodies)?.total || 0;
        return bodies.concat({
          parts,
          total: total + BODYPART_COST[parts],
        });
      },
      [] as { parts: BodyPartConstant; total: number }[],
    )
      .filter(({ total }) => {
        return total <= cost;
      })
      .map((c) => c.parts);
  } else {
    // 入れ物
    const bodies = [...MIN_BODY[role]];
    const diff = [...(DIFF_BODY[role] || MIN_BODY[role])];
    const getTotalCost = () =>
      _(bodies)
        .map((p) => BODYPART_COST[p])
        .sum();

    // cost以下かつ50個以下の間くっつける
    while (getTotalCost() <= cost && bodies.length <= 50) {
      bodies.push(diff[_.random(0, diff.length - 1)]);
    }

    // 1個分超えてるはずなので最後の１個を消して返す
    return bodies.slice(0, bodies.length - 1);
  }
}

export const DIRECTIONS: Record<DirectionConstant, string> = {
  [TOP_LEFT]: "TOP_LEFT",
  [TOP]: "TOP",
  [TOP_RIGHT]: "TOP_RIGHT",
  [LEFT]: "LEFT",
  [RIGHT]: "RIGHT",
  [BOTTOM_LEFT]: "BOTTOM_LEFT",
  [BOTTOM]: "BOTTOM",
  [BOTTOM_RIGHT]: "BOTTOM_RIGHT",
};

export function randomWalk(creep: Creep) {
  const directions = _(DIRECTIONS)
    .keys()
    .map((d) => Number(d))
    .run() as DirectionConstant[];
  return creep.move(directions[_.random(0, directions.length - 1)]);
}

export const MIN_BODY: Record<ROLES, BodyPartConstant[]> = Object.freeze({
  builder: [WORK, CARRY, MOVE],
  carrier: [CARRY, MOVE],
  defender: [],
  harvester: [WORK, CARRY, MOVE],
  repairer: [WORK, CARRY, MOVE],
  upgrader: [WORK, CARRY, MOVE],
});

export const HARVESTER_BODY = Object.freeze([
  // 最小構成
  WORK,
  MOVE,
  CARRY,
  // 作業効率
  WORK,
  WORK,
  WORK,
  WORK,
  // 容量
  ..._.range(43).map(() => CARRY),
]);

const DIFF_BODY: Partial<Record<ROLES, BodyPartConstant[]>> = Object.freeze({
  // ギリsourceまで行ければいいので
  harvester: [WORK, WORK, CARRY],
  upgrader: [WORK, CARRY, WORK, CARRY, MOVE],
});

export const getBodyCost = (bodies: BodyPartConstant[]) =>
  _(bodies)
    .map((p) => BODYPART_COST[p])
    .sum();

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

type CustomMove = (creep: Creep, target: RoomPosition | { pos: RoomPosition }, opt?: MoveToOpts) => ReturnType<Creep["moveTo"]>;

export const customMove: CustomMove = (creep, target, opt) => {
  if (creep.fatigue) {
    return OK;
  }

  const moved = creep.moveTo(target, {
    plainCost: 2,
    ignoreCreeps: !creep.pos.inRangeTo(target, 3),
    serializeMemory: false,
    ...opt,
  });

  if (moved === OK) {
    const directionDiff: Record<DirectionConstant, { dx: number; dy: number }> = {
      [TOP_LEFT]: { dy: -1, dx: -1 },
      [TOP]: { dy: -1, dx: 0 },
      [TOP_RIGHT]: { dy: -1, dx: 1 },
      [LEFT]: { dy: 0, dx: -1 },
      [RIGHT]: { dy: 0, dx: 1 },
      [BOTTOM_LEFT]: { dy: 1, dx: -1 },
      [BOTTOM]: { dy: 1, dx: 0 },
      [BOTTOM_RIGHT]: { dy: 1, dx: 1 },
    };

    const direction = creep.memory._move?.path?.[0].direction;

    const blocker = direction && creep.room.lookForAt(LOOK_CREEPS, creep.pos.x + directionDiff[direction].dx, creep.pos.y + directionDiff[direction].dy)?.[0];
    if (blocker && blocker.memory.moved !== undefined) {
      creep.pull(blocker);
      blocker.move(creep);
    }
  }

  return moved;
};

export function getCreepsInRoom(room: Room) {
  if (room.memory.creeps?.tick === Game.time) {
    return room.memory.creeps.names;
  } else {
    room.memory.creeps = {
      tick: Game.time,
      names: Object.entries(Game.creeps)
        .filter(([_, creep]) => creep.room.name === room.name)
        .map((entry) => entry[0]),
    };
    return room.memory.creeps.names;
  }
}

export function getSpawnNamesInRoom(room: Room) {
  if (room.memory.spawns?.tick === Game.time) {
    return room.memory.spawns.names;
  } else {
    room.memory.spawns = {
      tick: Game.time,
      names: Object.entries(Game.spawns)
        .filter(([_, spawns]) => spawns.room.name === room.name)
        .map((entry) => entry[0]),
    };
    return room.memory.spawns.names;
  }
}

export function pickUpAll(creep: Creep) {
  //withdraw
  // 通りがかりに落っこちてるリソースを拾う
  creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1).forEach((resource) => {
    creep.pickup(resource);
  });

  // 通りがかりの墓から拾う
  [...creep.pos.findInRange(FIND_TOMBSTONES, 1), ...creep.pos.findInRange(FIND_RUINS, 1)].forEach((tombstone) => {
    creep.withdraw(tombstone, RESOURCE_ENERGY);
  });
}

/**
 * 通りがかりのcreepから奪い取る
 */
export function stealBy(creep: Creep, roles: ROLES[], type: ResourceConstant = RESOURCE_ENERGY) {
  return creep.pos
    .findInRange(FIND_MY_CREEPS, 1, {
      filter: (c) => roles.includes(c.memory.role),
    })
    .map((t) => t.transfer(creep, type));
}
