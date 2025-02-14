import builder from "./role.builder";
import carrier from "./role.carrier";
import claimer from "./role.claimer";
import defender from "./role.defender";
import gatherer from "./role.gatherer";
import harvester from "./role.harvester";
import labManager from "./role.labManager";
import mineralHarvester from "./role.mineralHarvester";
import upgrader from "./role.upgrader";
export type CreepBehavior = (creep: Creeps) => void;

export const behaviors: Record<ROLES, CreepBehavior> = {
  builder,
  carrier,
  claimer,
  gatherer,
  defender,
  harvester,
  labManager,
  mineralHarvester,
  upgrader,
};
