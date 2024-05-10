import harvester from "./role.harvester";
import upgrader from "./role.upgrader";
import builder from "./role.builder";
import gatherer from "./role.gatherer";
import repairer from "./role.repairer";
import distributer from "./role.distributer";
export type CreepBehavior = (creep: Creeps) => void;

export const behaviors: Record<ROLES, CreepBehavior> = {
  harvester,
  upgrader,
  builder,
  gatherer,
  repairer,
  distributer,
};
