import builder from "./role.builder";
import carrier from "./role.carrier";
import claimer from "./role.claimer";
import harvester from "./role.harvester";
import mineralHarvester from "./role.mineralHarvester";
import upgrader from "./role.upgrader";
import repairer from "./role.repairer";
export type CreepBehavior = (creep: Creeps) => void;

export const behaviors: Record<ROLES, CreepBehavior> = {
  harvester,
  upgrader,
  builder,
  carrier,
  claimer,
  mineralHarvester,
  repairer,
};
