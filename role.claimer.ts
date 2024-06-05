import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove } from "./util.creep";
import { getSpawnsOrderdByRange } from "./utils";

const behavior: CreepBehavior = (claimer: Creeps) => {
  if (!isClaimer(claimer)) {
    return console.log(`${claimer.name} is not Builder`);
  }
  const moveMeTo = (target: RoomPosition | _HasRoomPosition) => customMove(claimer, target, {});

  const flag = Game.flags[claimer.memory.flagName];
  if (!flag) {
    claimer.suicide();
  }
  if ((flag.room?.controller?.level || 0) > 0) {
    const spawn = getSpawnsOrderdByRange(flag).first();
    if (spawn) {
      const recycle = spawn.recycleCreep(claimer);
      if (recycle === OK) {
        return recycle;
      } else if (recycle === ERR_NOT_IN_RANGE) {
        return moveMeTo(spawn);
      }
    } else {
      return ERR_NOT_FOUND;
    }
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
};

export default behavior;

function isClaimer(creep: Creep): creep is Claimer {
  return creep.memory.role === "claimer";
}
