import harvester from "./role.harvester";
export type CreepBehavior = (creep: Creeps) => void;

export const behaviors: Partial<Record<ROLES, CreepBehavior>> = {
  harvester,
};
