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

export function filterBodiesByCost(role: ROLES, cost: number) {
  const bodies = IDEAL_BODY[role]
    .reduce(
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
    });
  return {
    bodies: bodies.map((c) => c.parts),
    cost: _.last(bodies)?.total || 0,
  };
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

export const IDEAL_BODY: Record<ROLES, BodyPartConstant[]> = Object.freeze({
  builder: [
    // 最小構成
    WORK,
    CARRY,
    MOVE,
    // 偶数にする
    WORK,
    ..._(
      _.range(23).map(() => {
        // あとはMoveとCarryの繰り返し
        return [MOVE, CARRY];
      }),
    )
      .flatten<BodyPartConstant>()
      .run(),
  ],
  claimer: [CLAIM, MOVE],
  carrier: [
    ..._(
      _.range(25).map(() => {
        // あとはMoveとCarryの繰り返し
        return [MOVE, CARRY];
      }),
    )
      .flatten<BodyPartConstant>()
      .run(),
  ],
  harvester: [
    // 最小構成
    WORK,
    MOVE,
    CARRY,
    // 作業効率
    WORK,
    WORK,
    WORK,
    WORK,
    MOVE,
    MOVE,
  ],
  upgrader: [CARRY, MOVE, ..._.range(10).map(() => WORK), ..._.range(10).map(() => MOVE)],
});

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

  creep.memory.moved = creep.moveTo(target, {
    plainCost: 2,
    ignoreCreeps: !creep.pos.inRangeTo(target, 4),
    serializeMemory: false,
    ...opt,
    visualizePathStyle: {
      opacity: 0.55,
      stroke: toColor(creep),
      ...opt?.visualizePathStyle,
    },
  });

  if (creep.memory.moved === OK && Game.time % 2) {
    const { dy, dx } = creep.memory._move?.path?.[0] || {};

    if (dx !== undefined && dy !== undefined) {
      const blocker = creep.room.lookForAt(LOOK_CREEPS, creep.pos.x + dx, creep.pos.y + dy)?.[0];
      if (blocker && blocker.memory.moved !== OK) {
        const pull = creep.pull(blocker);
        const move = blocker.move(creep);
        (pull || move) &&
          console.log(JSON.stringify({ name: creep.name, pull: RETURN_CODE_DECODER[pull.toString()], move: RETURN_CODE_DECODER[move.toString()] }));
      }
    }
  }

  return creep.memory.moved;
};

export function getCreepsInRoom(room: Room) {
  return (() => {
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
  })()
    .map((name) => Game.creeps[name])
    .filter((c) => c);
}

export function getMainSpawn(room: Room) {
  return (
    ((room.memory.mainSpawn = room.memory.mainSpawn || _(Object.values(Game.spawns).filter((s) => s.room.name === room.name)).first()?.id) &&
      Game.getObjectById(room.memory.mainSpawn)) ||
    undefined
  );
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
export function withdrawBy(creep: Creep, roles: ROLES[], type: ResourceConstant = RESOURCE_ENERGY) {
  return creep.pos
    .findInRange(FIND_MY_CREEPS, 1, {
      filter: (c) => roles.includes(c.memory.role),
    })
    .map((t) => t.transfer(creep, type));
}

export function toColor({ id }: Creeps) {
  return `#${id.slice(-6)}`;
}
