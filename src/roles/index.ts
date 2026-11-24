import builder from "./builder";
import carrier from "./carrier";
import claimer from "./claimer";
import defender from "./defender";
import gatherer from "./gatherer";
import harvester from "./harvester";
import hauler from "./hauler";
import labManager from "./labManager";
import mineralHarvester from "./mineralHarvester";
import upgradeHauler from "./upgradeHauler";
import upgrader from "./upgrader";

export const behaviors: Record<ROLES, CreepBehavior> = {
  builder,
  carrier,
  claimer,
  gatherer,
  defender,
  harvester,
  hauler,
  labManager,
  mineralHarvester,
  upgrader,
  upgradeHauler,
};
