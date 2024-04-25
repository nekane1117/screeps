import { behaviors } from "./roles"
import { roomBehavior } from "./role.room"
import spawnBehavior from "./role.spawn"
import { containerBehavior } from "./structure.container"

module.exports.loop = function () {
  //死んだcreepは削除する
  Object.keys(Memory.creeps || {}).forEach((name) => {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name]
      console.log("Clearing non-existing creep memory:", name)
    }
  })

  Object.keys(Memory.rooms || {}).forEach((name) => {
    if (!Game.rooms[name]) {
      delete Memory.rooms[name]
      console.log("Clearing non-existing rooms memory:", name)
    }
  })

  // Room -> Spawn -> Container -> Creep
  const spawnGroup = _.groupBy(Object.values(Game.spawns), (c) => c.room.name)
  const creepGroup = _.groupBy(Object.values(Game.creeps), (c) => c.room.name)

  Object.entries(Game.rooms).forEach(([_roomName, room]) => {
    roomBehavior(room)

    spawnGroup[room.name]?.map(spawnBehavior)
    ;(Object.keys(room.memory.containers) as Id<StructureContainer>[]).forEach((id) => containerBehavior(id))

    creepGroup[room.name]?.map((c) => !c.spawning && behaviors[c.memory.role]?.(c))
  })
}
