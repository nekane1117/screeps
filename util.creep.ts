import { complexOrder } from "./util.array";
import { readonly } from "./utils";

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
  builder: ([WORK, CARRY, MOVE, WORK] as BodyPartConstant[])
    .concat(
      ..._.range(25).map((i) => {
        const bodies = [CARRY, MOVE];
        return bodies[i % bodies.length];
      }),
    )
    .slice(0, 50),
  repairer: ([WORK, MOVE] as BodyPartConstant[])
    .concat(
      ..._.range(25).map((i) => {
        const bodies = [CARRY, MOVE];
        return bodies[i % bodies.length];
      }),
    )
    .slice(0, 50),
  claimer: [CLAIM, MOVE],
  reserver: _.range(4).map((i) => {
    const bodies = [CLAIM, MOVE];
    return bodies[i % bodies.length];
  }),
  remoteHarvester: _.range(50)
    .map((i) => {
      const b = [WORK, MOVE, CARRY, CARRY, MOVE, CARRY, CARRY, MOVE, CARRY, CARRY];
      return b[i % b.length];
    })
    .slice(0, 50),
  carrier: ([] as BodyPartConstant[])
    .concat(
      ..._.range(12).map((i) => {
        const b = [MOVE, CARRY];
        return b[i % b.length];
      }),
    )
    .slice(0, 50),
  labManager: [MOVE, CARRY, CARRY],
  defender: _.range(50).map((i) => {
    const b = [MOVE, RANGED_ATTACK, RANGED_ATTACK, MOVE, HEAL, HEAL, MOVE, TOUGH, ATTACK];
    return b[i % b.length];
  }),
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
  upgrader: [],
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
    serializeMemory: false,
    ...opt,
    visualizePathStyle: {
      opacity: 0.55,
      stroke: toColor(creep),
      ...opt?.visualizePathStyle,
    },
  });
  if (creep.memory.moved === OK && Game.time % 3) {
    const { dy, dx } = creep.memory._move?.path?.[0] || {};
    const isInRange = (n: number) => {
      return 0 < n && n < 49;
    };

    if (dx !== undefined && dy !== undefined && isInRange(creep.pos.x + dx) && isInRange(creep.pos.y + dy)) {
      const blocker = creep.room.lookForAt(LOOK_CREEPS, creep.pos.x + dx, creep.pos.y + dy)?.[0];
      if (blocker && blocker.memory.moved !== OK) {
        const pull = creep.pull(blocker);
        const move = blocker.move(creep);
        blocker.memory._move = undefined;
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

export function moveRoom(creep: Creeps, fromRoom: string, toRoom: string) {
  const memory = readonly(creep.memory);

  // メモリ初期化処理
  creep.memory.__moveRoom = memory.__moveRoom || {};

  const route =
    memory.__moveRoom?.route ||
    (creep.memory.__moveRoom.route = Game.map.findRoute(fromRoom, toRoom, {
      routeCallback(roomName) {
        const parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
        // 数値化した座標が10で割れるときはHighway
        const isHighway = parsed && (Number(parsed[1]) % 10 === 0 || Number(parsed[2]) % 10 === 0);
        // myが取れるときは自室
        const isMyRoom = Game.rooms[roomName] && Game.rooms[roomName].controller && Game.rooms[roomName].controller?.my;
        // 自室か高速道路を通る
        if (isHighway || isMyRoom) {
          return 1;
        } else {
          // それ以外は遠回り
          return 2.5;
        }
      },
    }));
  if (!Array.isArray(route)) {
    // パスが見つからないときは初期化して終わる
    creep.memory.__moveRoom.route = undefined;
    return route;
  }

  const current = route[route.findIndex((r) => r.room === creep.pos.roomName) + 1];
  if (!current) {
    // 現在地が見つからないのもおかしいので初期化して終わる
    creep.memory.__moveRoom.route = undefined;
    return;
  }

  // 向かう先を指定する
  if (memory.__moveRoom?.exit?.roomName !== creep.pos.roomName) {
    creep.memory.__moveRoom.exit = creep.pos.findClosestByPath(current.exit);
  }

  // 移動してみる
  const moved =
    memory.__moveRoom?.exit && customMove(creep, new RoomPosition(memory.__moveRoom.exit.x, memory.__moveRoom.exit.y, memory.__moveRoom.exit.roomName));
  if (moved !== OK) {
    const code = moved ? RETURN_CODE_DECODER[moved.toString()] : "no exit";
    console.log(`${creep.name}:${code}`);
    creep.say(code.replace("ERR_", ""));
    // OKじゃなかったらなんか変なので初期化する
    creep.memory.__moveRoom.route = undefined;
    creep.memory.__moveRoom.exit = undefined;
  }
  return moved;
}

export function getCarrierBody(room: Room, role: ROLES): BodyPartConstant[] {
  const safetyFactor = 2;

  const bodyCycle: BodyPartConstant[] = [MOVE, CARRY, CARRY];
  let costTotal = 0;
  const avgSize = room.memory.carrySize[role];
  // 個数 (÷50の切り上げ)
  // 安全係数
  // の２倍(CARRY,MOVE)
  return _.range(Math.ceil(avgSize / 50) * safetyFactor * 1.5)
    .map((i) => {
      const parts = bodyCycle[i % bodyCycle.length];
      costTotal += BODYPART_COST[parts];
      return { parts, costTotal };
    })
    .filter((p) => p.costTotal <= room.energyAvailable)
    .map((p) => p.parts);
}
