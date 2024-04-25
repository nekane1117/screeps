import { CreepBehavior } from "./roles"
import { RETURN_CODE_DECODER, commonHarvest, customMove, isStoreTarget, pickUpAll, randomWalk } from "./util.creep"

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isBuilder(creep)) {
    return console.log(`${creep.name} is not Builder`)
  }

  // https://docs.screeps.com/simultaneous-actions.html

  // harvest
  commonHarvest(creep)

  // build
  if (!(creep.memory.buildingId || (creep.memory.buildingId = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES, { ignoreCreeps: true })?.id))) {
    // 完全に見つからなければうろうろしておく
    randomWalk(creep)
  } else {
    const site = Game.getObjectById(creep.memory.buildingId)
    if (site) {
      switch ((creep.memory.built = creep.build(site))) {
        case ERR_NOT_ENOUGH_RESOURCES:
          // 手持ちが足らないときは収集モードに切り替える
          changeMode(creep, "collecting")
          break
        // 対象が変な時はクリアする
        case ERR_INVALID_TARGET:
          creep.memory.buildingId = undefined
          break
        // 建築モードで離れてるときは近寄る
        case ERR_NOT_IN_RANGE:
          if (creep.memory.mode === "working") {
            customMove(creep, site)
          }
          break

        // 有りえない系
        case ERR_NOT_OWNER: // 自creepじゃない
        case ERR_NO_BODYPART:
          console.log(`${creep.name} build returns ${RETURN_CODE_DECODER[creep.memory.built.toString()]}`)
          creep.say(RETURN_CODE_DECODER[creep.memory.built.toString()])
          break

        // 問題ない系
        case OK:
        case ERR_BUSY:
        default:
          break
      }
    } else {
      // 指定されていたソースが見つからないとき
      // 対象をクリアしてうろうろしておく
      creep.memory.buildingId = undefined
      randomWalk(creep)
    }
  }

  // withdraw
  if (
    creep.memory.storeId ||
    (creep.memory.storeId = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s): s is StoreTarget => {
        return isStoreTarget(s) && ![STRUCTURE_SPAWN, STRUCTURE_EXTENSION].some((t) => t === s.structureType) && s.store.getUsedCapacity(RESOURCE_ENERGY) !== 0
      },
    })?.id)
  ) {
    const store = Game.getObjectById(creep.memory.storeId)
    if (store) {
      creep.memory.worked = creep.withdraw(store, RESOURCE_ENERGY)
      switch (creep.memory.worked) {
        case ERR_NOT_ENOUGH_RESOURCES: // 空っぽ
        case ERR_INVALID_TARGET: // 対象が変
          creep.memory.storeId = undefined
          break

        // 満タンまで取った
        case ERR_FULL:
          changeMode(creep, "working")
          break
        case ERR_NOT_IN_RANGE:
          if (creep.memory.mode === "collecting") {
            const moved = customMove(creep, store)
            console.log(`${creep.name} ${RETURN_CODE_DECODER[moved.toString()]}`)
            moved !== OK && creep.say(RETURN_CODE_DECODER[moved.toString()])
          }
          break
        // 有りえない系
        case ERR_NOT_OWNER:
        case ERR_INVALID_ARGS:
          console.log(`${creep.name} build returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`)
          creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()])
          break
        // 問題ない系
        case OK:
        case ERR_BUSY:
        default:
          break
      }
    } else {
      creep.memory.storeId = undefined
    }
  }

  // withdraw
  // 落っこちてるものを拾う
  pickUpAll(creep)

  // 通りがかりにharvesterが居たら奪い取る
  creep.pos.findInRange(FIND_MY_CREEPS, 1, { filter: (c) => ["harvester", "carrier"].some((r) => r === c.memory.role) }).forEach((c) => {
    c.transfer(creep, RESOURCE_ENERGY)
  })

  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    changeMode(creep, "working")
  }
  if (creep.store[RESOURCE_ENERGY] === 0) {
    changeMode(creep, "collecting")
  }
}

export default behavior

function isBuilder(creep: Creep): creep is Builder {
  return creep.memory.role === "builder"
}
const changeMode = (creep: Builder, mode: "working" | "collecting") => {
  if (mode !== creep.memory.mode) {
    creep.say(mode)
    if (mode === "working") {
      creep.memory.mode = mode
    } else {
      creep.memory.mode = creep.room.find(FIND_STRUCTURES, {
        filter: (s): s is StoreTarget => {
          return isStoreTarget(s) && s.store.getUsedCapacity(RESOURCE_ENERGY) !== 0
        },
      })
        ? "collecting"
        : "harvesting"
    }
    creep.memory.buildingId = undefined
    creep.memory.harvestTargetId = undefined
    creep.memory.harvested = undefined
    creep.memory.storeId = undefined
  }
}
