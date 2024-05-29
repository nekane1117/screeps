import builder from "./role.builder";
import carrier from "./role.carrier";
import claimer from "./role.claimer";
import defender from "./role.defender";
import harvester from "./role.harvester";
import mineralHarvester from "./role.mineralHarvester";
import mineralCarrier from "./role.mineralCarrier";
import upgrader from "./role.upgrader";
import repairer from "./role.repairer";
export type CreepBehavior = (creep: Creeps) => void;

export const behaviors: Record<ROLES, CreepBehavior> = {
  harvester,
  upgrader,
  builder,
  carrier,
  claimer,
  defender,
  mineralHarvester,
  mineralCarrier,
  repairer,
};
