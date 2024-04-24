export function isStoreTarget(x: Structure): x is StoreTarget {
  return [STRUCTURE_CONTAINER, STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_STORAGE, STRUCTURE_LINK].some((t) => t === x.structureType)
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
] as [number, number][])

export function bodyMaker(role: ROLES, cost: number): BodyPartConstant[] {
  // 入れ物
  const bodies = [...MIN_BODY[role]]
  const getTotalCost = () =>
    _(bodies)
      .map((p) => BODYPART_COST[p])
      .sum()
  let cnt = 0

  // cost以下かつ50個以下の間くっつける
  while (getTotalCost() <= cost && bodies.length <= 50) {
    bodies.push(MIN_BODY[role][cnt++ % MIN_BODY[role].length])
  }

  // 1個分超えてるはずなので最後の１個を消して返す
  return bodies.slice(0, bodies.length - 1)
}

export function randomWalk(creep: Creep) {
  const directions = [TOP_LEFT, TOP, TOP_RIGHT, LEFT, RIGHT, BOTTOM_LEFT, BOTTOM, BOTTOM_RIGHT]
  return creep.move(directions[_.random(0, directions.length - 1)])
}

export const MIN_BODY: Record<ROLES, BodyPartConstant[]> = Object.freeze({
  builder: [WORK, CARRY, MOVE],
  carrier: [WORK, CARRY, MOVE],
  defender: [],
  harvester: [WORK, CARRY, MOVE],
  repairer: [WORK, CARRY, MOVE],
  upgrader: [WORK, CARRY, MOVE],
})

export const getBodyCost = (bodies: BodyPartConstant[]) =>
  _(bodies)
    .map((p) => BODYPART_COST[p])
    .sum()

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
})

type CustomMove = (creep: Creep, target: RoomPosition | { pos: RoomPosition }) => ReturnType<Creep["moveTo"]>
export const customMove: CustomMove = (creep, target) => {
  if (creep.fatigue) {
    return OK
  }
  return creep.moveTo(target, {
    ignoreCreeps: !creep.pos.inRangeTo(target, getCreepsInRoom(creep.room).length),
    serializeMemory: false,
  })
}

export function getCreepsInRoom(room: Room) {
  if (room.memory.creeps?.tick === Game.time) {
    return room.memory.creeps.names
  } else {
    room.memory.creeps = {
      tick: Game.time,
      names: Object.entries(Game.creeps)
        .filter(([_, creep]) => creep.room.name === room.name)
        .map((entry) => entry[0]),
    }
    return room.memory.creeps.names
  }
}

export function getSpawnNamesInRoom(room: Room) {
  if (room.memory.spawns?.tick === Game.time) {
    return room.memory.spawns.names
  } else {
    room.memory.spawns = {
      tick: Game.time,
      names: Object.entries(Game.spawns)
        .filter(([_, spawns]) => spawns.room.name === room.name)
        .map((entry) => entry[0]),
    }
    return room.memory.spawns.names
  }
}

export function commonHarvest(creep: Harvester | Builder | Upgrader) {
  // 対象が見つからない場合
  if (
    !(
      creep.memory.harvestTargetId ||
      (creep.memory.harvestTargetId = creep.pos.findClosestByPath(
        _(creep.room.memory.activeSource)
          .map((id) => Game.getObjectById(id))
          .compact()
          .value(),
        {
          ignoreCreeps: true,
        },
      )?.id)
    )
  ) {
    // うろうろしておく
    return randomWalk(creep)
  }

  const source = Game.getObjectById(creep.memory.harvestTargetId)

  if (!source) {
    // 指定されていたソースが見つからないとき
    // 対象をクリアしてうろうろしておく
    creep.memory.harvestTargetId = undefined
    return randomWalk(creep)
  }

  const returnVal = creep.harvest(source)
  switch (returnVal) {
    case OK:
      return OK
    // 離れていた時は向かう
    case ERR_NOT_IN_RANGE: {
      const returnVal = customMove(creep, source)
      switch (returnVal) {
        // 問題のない者たち
        case OK:
        case ERR_BUSY:
        case ERR_TIRED:
          return returnVal
        default:
          creep.say(RETURN_CODE_DECODER[returnVal.toString()])
          creep.memory.harvestTargetId = undefined
          return returnVal
      }
    }
    case ERR_NOT_ENOUGH_RESOURCES:
    case ERR_NOT_FOUND:
    case ERR_INVALID_TARGET:
      creep.memory.harvestTargetId = undefined
      return returnVal
    case ERR_NOT_OWNER:
    case ERR_BUSY:
    case ERR_TIRED:
    case ERR_NO_BODYPART:
    default:
      // 無視するやつは戻り値をそのまま返す
      creep.say(RETURN_CODE_DECODER[returnVal.toString()])
      return returnVal
  }
}
