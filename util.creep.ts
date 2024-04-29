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

const DIFF_BODY: Partial<Record<ROLES, BodyPartConstant[]>> = Object.freeze({
  // ギリsourceまで行ければいいので
  harvester: [WORK, WORK, CARRY],
  builder: [WORK, CARRY],
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
  return creep.moveTo(target, {
    ignoreCreeps: !creep.pos.inRangeTo(target, getCreepsInRoom(creep.room).length) && Game.time % 5 !== 0,
    serializeMemory: false,
    ...opt,
  });
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

type CommonHarvestOpts = {
  forceMove: boolean;
};

export function commonHarvest(creep: Harvester | Builder | Upgrader | Repairer, _opts?: Partial<CommonHarvestOpts>) {
  // 対象設定処理
  if (
    !(
      creep.memory.harvestTargetId ||
      (creep.memory.harvestTargetId = creep.pos.findClosestByPath(
        _(creep.room.memory.activeSource)
          .map((id) => Game.getObjectById(id))
          .compact()
          .value(),
        { ignoreCreeps: true },
      )?.id)
    )
  ) {
    // 完全に見つからなければうろうろしておく
    randomWalk(creep);
  } else {
    // 対象が見つかった時
    const source = Game.getObjectById(creep.memory.harvestTargetId);
    if (source) {
      creep.memory.harvested = {
        tick: Game.time,
        result: creep.harvest(source),
      };
      switch (creep.memory.harvested.result) {
        case ERR_NOT_IN_RANGE:
          if (creep.memory.mode === "harvesting") {
            // 収集モードで近くにいないときは近寄る
            creep.memory.harvestMoved = customMove(creep, source);
            switch (creep.memory.harvestMoved) {
              case OK:
                break;
              case ERR_NO_PATH:
                creep.memory.harvestTargetId = undefined;
                console.log(`ERR_NO_PATH,pos:${creep.pos.x},${creep.pos.y},_move:${JSON.stringify(creep.memory._move)}`);
                break;

              default:
                creep.say(RETURN_CODE_DECODER[creep.memory.harvestMoved.toString()]);
                break;
            }
          }
          break;

        // 資源がダメ系
        case ERR_NOT_ENOUGH_RESOURCES: // 空っぽ
        case ERR_INVALID_TARGET: // 対象が変
          creep.memory.harvestTargetId = undefined;
          break;
        // 来ないはずのやつ
        case ERR_NOT_OWNER: // 自creepじゃない
        case ERR_NOT_FOUND: // mineralは対象外
        case ERR_NO_BODYPART: // WORKが無い
          console.log(`${creep.name} harvest returns ${RETURN_CODE_DECODER[creep.memory.harvested.result.toString()]}`);
          creep.say(RETURN_CODE_DECODER[creep.memory.harvested.result.toString()]);
          break;
        // 大丈夫なやつ
        case OK: // OK
        case ERR_TIRED: // 疲れた
        case ERR_BUSY: // spawning
        default:
          break;
      }
    } else {
      // 指定されていたソースが見つからないとき
      // 対象をクリアしてうろうろしておく
      creep.memory.harvestTargetId = undefined;
      creep.memory.harvested = undefined;
      randomWalk(creep);
    }
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
