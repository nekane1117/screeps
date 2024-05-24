import { StructureBehavior } from "./structures";
import { filterBodiesByCost } from "./util.creep";
import { getSpawnsOrderdByRange } from "./utils";

const behavior: StructureBehavior = (controller: Structure) => {
  if (!isC(controller)) {
    return console.log("type is invalid", controller);
  }
  controller.room.visual.text(`bucket  : ${Game.cpu.bucket.toLocaleString()}`, controller.pos.x, controller.pos.y - 2);
  controller.room.visual.text(`progress:${(controller.progressTotal - controller.progress).toLocaleString()}`, controller.pos.x, controller.pos.y - 1);

  const upgrader = Object.values(Game.creeps).filter((c): c is Upgrader => {
    return c.memory.role === "upgrader" && c.memory.baseRoom === controller.pos.roomName;
  });

  if (!upgrader.length) {
    const spawn = getSpawnsOrderdByRange(controller, 1).first();
    if (spawn && spawn.room.energyAvailable >= 300) {
      spawn.spawnCreep(filterBodiesByCost("upgrader", spawn.room.energyAvailable).bodies, `U_${controller.room.name}_${Game.time}`, {
        memory: {
          baseRoom: controller.room.name,
          mode: "🛒",
          role: "upgrader",
        } as UpgraderMemory,
      });
    } else {
      console.log("controller can't find spawn");
    }
  }
};

export default behavior;
function isC(s: Structure): s is StructureController {
  return s.structureType === STRUCTURE_CONTROLLER;
}
