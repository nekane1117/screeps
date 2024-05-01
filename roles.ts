import harvester from "./role.harvester";
import upgrader from "./role.upgrader";
const roles: Record<ROLES, CreepBehavior> = {
  harvester,
  upgrader,
};

export default roles;
