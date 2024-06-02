import builder from "./role.builder";
import carrier from "./role.carrier";
import claimer from "./role.claimer";
import defender from "./role.defender";
import harvester from "./role.harvester";
import labManager from "./role.labManager";
import mineralCarrier from "./role.mineralCarrier";
import mineralHarvester from "./role.mineralHarvester";
import remoteHarvester from "./role.remoteHarvester";
import repairer from "./role.repairer";
import reserver from "./role.reserver";
import upgrader from "./role.upgrader";
export type CreepBehavior = (creep: Creeps) => void;

export const behaviors: Record<ROLES, CreepBehavior> = {
  builder,
  carrier,
  claimer,
  defender,
  harvester,
  labManager,
  mineralCarrier,
  mineralHarvester,
  remoteHarvester,
  repairer,
  reserver,
  upgrader,
};
