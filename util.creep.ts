import { complexOrder } from "./util.array";

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
    bodies: complexOrder(
      bodies.map((c) => c.parts),
      [
        (p) => {
          return ([TOUGH, HEAL, RANGED_ATTACK, ATTACK, CLAIM, MOVE, CARRY, WORK] as BodyPartConstant[]).indexOf(p);
        },
      ],
    ).run(),
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
  repairer: [
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
  labManager: [
    ..._(
      _.range(25).map(() => {
        // あとはMoveとCarryの繰り返し
        return [MOVE, CARRY];
      }),
    )
      .flatten<BodyPartConstant>()
      .run(),
  ],
  defender: [
    ..._(
      _.range(5).map(() => {
        return [ATTACK, MOVE, ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, TOUGH, MOVE];
      }),
    )
      .flatten<BodyPartConstant>()
      .run(),
  ],
  mineralCarrier: [
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
  mineralHarvester: [
    // 最小構成
    WORK,
    MOVE,
    CARRY,
    CARRY,
    // 作業効率
    ..._(
      _.range(23).map(() => {
        // あとはMoveとCarryの繰り返し
        return [WORK, MOVE];
      }),
    )
      .flatten<BodyPartConstant>()
      .run(),
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
  if (room.memory.creeps) {
    return room.memory.creeps;
  } else {
    return (room.memory.creeps = Object.values(Game.creeps)
      .filter((c) => c.memory.baseRoom === room.name)
      .reduce((creeps, c) => {
        if (!creeps[c.memory.role]) {
          creeps[c.memory.role] = [];
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        creeps[c.memory.role]!.push(c as any);
        return creeps;
      }, {} as CreepsCache));
  }
}

export function getMainSpawn(room: Room): StructureSpawn | undefined {
  const spawn = room.memory.mainSpawn && Game.getObjectById(room.memory.mainSpawn);

  if (spawn) {
    return spawn;
  } else {
    const spawn = _(Object.values(Game.spawns).filter((s) => s.room.name === room.name)).first();
    room.memory.mainSpawn = spawn?.id;
    return spawn;
  }
}

export function pickUpAll(creep: Creep, resourceType: ResourceConstant = RESOURCE_ENERGY) {
  //withdraw
  // 通りがかりに落っこちてるリソースを拾う
  creep.pos
    .findInRange(FIND_DROPPED_RESOURCES, 1, {
      filter: (s) => s.resourceType === resourceType,
    })
    .forEach((resource) => {
      creep.pickup(resource);
    });

  // 通りがかりの墓から拾う
  [...creep.pos.findInRange(FIND_TOMBSTONES, 1), ...creep.pos.findInRange(FIND_RUINS, 1)].forEach((tombstone) => {
    creep.withdraw(tombstone, resourceType);
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

export function getRepairTarget(roomName: string) {
  return Game.rooms[roomName].find(FIND_STRUCTURES, {
    filter: (s) => {
      switch (s.structureType) {
        case STRUCTURE_RAMPART:
        case STRUCTURE_WALL:
          return s.hits < 3000;
        default:
          return s.hits < s.hits * 0.5;
      }
    },
  });
}
