import harvester from "./role.harvester";
import upgrader from "./role.upgrader";
import carrier from "./role.carrier";
const roles: Record<ROLES, CreepBehavior> = {
  harvester,
  upgrader,
  carrier,
};

export default roles;
