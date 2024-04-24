import { getSpawnNamesInRoom, squareDiff } from "./util.creep"

export function roomBehavior(room: Room) {
  // Roomとしてやっておくこと

  if (room.memory.harvesterLimit === undefined) {
    room.memory.harvesterLimit = getHarvesterLimit(room)
  }

  // 今使えるソース
  room.memory.activeSource = findActiceSource(room)

  if (!room.memory.roadLayed || Game.time - room.memory.roadLayed > 5000) {
    console.log("roadLayer in " + Game.time)
    roadLayer(room)
  }

  // エクステンション建てる
  creteExtensions(room)
}

function getHarvesterLimit(room: Room) {
  return _(room.find(FIND_SOURCES))
    .map((source) => {
      // 8近傍を取得
      const terrain = room.getTerrain()
      return _(squareDiff)
        .map(([dx, dy]: readonly [number, number]) => {
          return terrain.get(source.pos.x + dx, source.pos.y + dy) !== TERRAIN_MASK_WALL ? 1 : 0
        })
        .run()
    })
    .flatten()
    .sum()
}

/** 今使えるソース */
function findActiceSource(room: Room) {
  return _(
    room.find(FIND_SOURCES_ACTIVE, {
      filter: (s) => {
        return !!_(squareDiff)
          // 8近傍の位置を取得する
          .map(([dx, dy]: [number, number]) => {
            return room.getPositionAt(s.pos.x + dx, s.pos.y + dy)
          })
          .compact()
          // 壁以外かつcreepのいないマス
          .filter((pos: RoomPosition) => pos.lookFor(LOOK_TERRAIN)[0] !== "wall" && !pos.lookFor(LOOK_CREEPS).length)
          // がある
          .size()
      },
    }),
  )
    .map((s) => s.id)
    .value()
}

/** エクステンション建てる */
function creteExtensions(room: Room) {
  const spawn = Object.entries(Game.spawns).find(([_, s]) => s.room.name === room.name)?.[1]
  if (room.controller && spawn) {
    const extensions = [...room.find(FIND_MY_CONSTRUCTION_SITES), ...room.find(FIND_MY_STRUCTURES)].filter((s) => s.structureType === STRUCTURE_EXTENSION)

    if (extensions.length < CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][room.controller.level]) {
      for (const dist of _.range(1, 25)) {
        for (const dy of _.range(-dist, dist + 1)) {
          for (const dx of _.range(-dist, dist + 1)) {
            if (Math.abs(dx) + Math.abs(dy) === dist && (dx + dy) % 2 === 0) {
              if (room.createConstructionSite(spawn.pos.x + dx, spawn.pos.y + dy, STRUCTURE_EXTENSION) === OK) {
                // つくれた場合抜ける
                return
              }
            }
          }
        }
      }
    }
  }
}

// 全てのspawnからsourceまでの道を引く
function roadLayer(room: Room) {
  _(getSpawnNamesInRoom(room))
    .map((name) => Game.spawns[name])
    .compact()
    .forEach((spawn) => {
      const findCustomPath = (s: Source | StructureSpawn) =>
        spawn.pos.findPathTo(s, {
          ignoreCreeps: true,
          plainCost: 1.1, // 道よりいくらか高い
          swampCost: 1.1, // これから道を引くのでplainと同じ
          costCallback(roomName, costMatrix) {
            const room = Game.rooms[roomName]
            _.range(50).forEach((x) => {
              _.range(50).forEach((y) => {
                const pos = room.getPositionAt(x, y)
                if (!pos) {
                  return
                } else if (pos.look().some((s) => "structureType" in s && s.structureType === STRUCTURE_ROAD)) {
                  // 道がある or 道を引く場合道と同じ値にする
                  costMatrix.set(x, y, 1)
                }
              })
            })
          },
        })

      return (
        _([
          ...room.find(FIND_SOURCES),
          ...room.find(FIND_MY_STRUCTURES, {
            filter: (s): s is StructureSpawn => s.structureType === STRUCTURE_CONTROLLER,
          }),
        ])
          // 近い順にする
          .sortBy((s) => findCustomPath(s).length)
          .map((s) => {
            return findCustomPath(s).map((path) => {
              if (room.getTerrain().get(path.x, path.y) !== TERRAIN_MASK_WALL) {
                room.createConstructionSite(path.x, path.y, STRUCTURE_ROAD)
              }
            })
          })
          .run()
      )
    })
    .run()
  room.memory.roadLayed = Game.time
}
