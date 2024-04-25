import { CreepBehavior } from "./roles"
import { RETURN_CODE_DECODER, commonHarvest, customMove, pickUpAll, stealBy } from "./util.creep"

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isUpgrader(creep)) {
    return console.log(`${creep.name} is not Upgrader`)
  }

  if (!creep.room.controller) {
    return creep.suicide()
  }
  // https://docs.screeps.com/simultaneous-actions.html

  if (creep.memory.mode === "harvesting") {
    // harvest
    commonHarvest(creep)
  } else {
    // upgrade
    creep.memory.worked = creep.upgradeController(creep.room.controller)

    switch (creep.memory.worked) {
      // 資源不足
      case ERR_NOT_ENOUGH_RESOURCES:
        changeMode(creep, "harvesting")
        break
      case ERR_NOT_IN_RANGE:
        if (creep.memory.mode === "working") {
          customMove(creep, creep.room.controller)
        }
        break
      // 有りえない系
      case ERR_NOT_OWNER:
      case ERR_INVALID_TARGET:
      case ERR_NO_BODYPART:
        console.log(`${creep.name} transfer returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`)
        creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()])
        break
      // 問題ない系
      case OK:
      case ERR_BUSY:
      default:
        break
    }
  }
  // withdraw
  // 落っこちてるものを拾う
  pickUpAll(creep)

  // 通りがかりにharvesterが居たら奪い取る
  stealBy(creep, ["harvester", "carrier"])

  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    changeMode(creep, "working")
  }
  if (creep.store[RESOURCE_ENERGY] === 0) {
    changeMode(creep, "harvesting")
  }
}

export default behavior

function isUpgrader(creep: Creep): creep is Upgrader {
  return creep.memory.role === "upgrader"
}
const changeMode = (creep: Upgrader, mode: BuilderMemory["mode"]) => {
  if (mode !== creep.memory.mode) {
    creep.say(mode)
    creep.memory.mode = mode
    creep.memory.harvestTargetId = undefined
    creep.memory.harvested = undefined
  }
}
