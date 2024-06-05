import { CreepBehavior } from "./roles";

const behavior: CreepBehavior = (creep: Creeps) => {
  creep.memory.role = "builder";
};
export default behavior;
