import { BODY } from "./constants";
import { getBodyByCost, getCreepNamesInRoom, getSpawnsInRoom } from "./utils";

export default function (controller: Structure) {
  if (!isContoller(controller)) {
    return console.log(`${controller.id} is not contoller:${controller.structureType}`);
  }

  const creeps = getCreepNamesInRoom(controller.room);

  const { energyAvailable, energyCapacityAvailable } = controller.room;

  if (creeps.upgrader?.length === 0 && energyAvailable / energyCapacityAvailable > 0.8) {
    getSpawnsInRoom(controller.room)
      .find((s) => !s.spawning)
      ?.spawnCreep(getBodyByCost(BODY.upgrader, energyAvailable), `U_${controller.room.name}`, {
        memory: {
          role: "upgrader",
          mode: "collecting",
        } as UpgraderMemory,
      });
  }
}

function isContoller(s: Structure): s is StructureController {
  return s.structureType === STRUCTURE_CONTROLLER;
}
