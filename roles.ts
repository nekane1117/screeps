import builder from "./role.builder";
import claimer from "./role.claimer";
import distributer from "./role.distributer";
import gatherer from "./role.gatherer";
import harvester from "./role.harvester";
import repairer from "./role.repairer";
import upgrader from "./role.upgrader";
export type CreepBehavior = (creep: Creeps) => void;

export const behaviors: Record<ROLES, CreepBehavior> = {
  harvester,
  upgrader,
  builder,
  gatherer,
  repairer,
  distributer,
  claimer,
};
