import harvester from "./role.harvester";
import upgrader from "./role.upgrader";
export type CreepBehavior = (creep: Creeps) => void;

export const behaviors: Partial<Record<ROLES, CreepBehavior>> = {
  harvester,
  upgrader,
};
