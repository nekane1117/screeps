import { CreepBehavior } from "./roles";

const behavior: CreepBehavior = (claimer: Creeps) => {
  if (!isClaimer(claimer)) {
    return console.log(`${claimer.name} is not Builder`);
  }

  claimer;
};

export default behavior;

function isClaimer(creep: Creep): creep is Claimer {
  return creep.memory.role === "claimer";
}
