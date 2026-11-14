import builder from "./builder";
import carrier from "./carrier";
import claimer from "./claimer";
import defender from "./defender";
import gatherer from "./gatherer";
import harvester from "./harvester";
import labManager from "./labManager";
import mineralHarvester from "./mineralHarvester";
import upgrader from "./upgrader";
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
