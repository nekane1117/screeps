import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove } from "./util.creep";

const behavior: CreepBehavior = (claimer: Creeps) => {
  if (!isClaimer(claimer)) {
    return console.log(`${claimer.name} is not Builder`);
  }
  const moveMeTo = (target: RoomPosition | _HasRoomPosition) =>
    customMove(claimer, target, {
      ignoreCreeps: !claimer.pos.inRangeTo(target, 2),
    });

  const flag = Game.flags[claimer.memory.flagName];
  if (!flag) {
    claimer.suicide();
  }
  const target = flag.room?.controller || flag;
  if (target.room?.name === claimer.room.name && "structureType" in target) {
    const claimed = claimer.claimController(target);
    switch (claimed) {
      case ERR_NOT_IN_RANGE:
        moveMeTo(target);
        break;
      case OK:
        break;
      default:
        console.log(RETURN_CODE_DECODER[claimed.toString()]);
        break;
    }
  } else {
    moveMeTo(target);
  }
  console.log(RETURN_CODE_DECODER[moveMeTo(flag.room?.controller || flag).toString()]);
};

export default behavior;

function isClaimer(creep: Creep): creep is Claimer {
  return creep.memory.role === "claimer";
}
