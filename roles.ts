import harvester from "./role.harvester"
import upgrader from "./role.upgrader"
import builder from "./role.builder"
import carrier from "./role.carrier"
export type CreepBehavior = (creep: Creeps) => void

export const behaviors: Partial<Record<ROLES, CreepBehavior>> = {
  harvester,
  upgrader,
  builder,
  carrier,
}
