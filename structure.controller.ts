import { StructureBehavior } from "./structures";
import { filterBodiesByCost } from "./util.creep";
import { getSpawnsOrderdByRange } from "./utils";

const behavior: StructureBehavior = (controller: Structure) => {
  if (!isC(controller)) {
    return console.log("type is invalid", controller);
  }

  const showSummary = (texts: string[]) => {
    texts.forEach((text, i) => {
      controller.room.visual.text(text, Math.max(controller.pos.x - 3, 1), Math.max(1, controller.pos.y - texts.length + i), { align: "left" });
    });
  };

  showSummary([
    `energy  : ${controller.room.energyAvailable} / ${controller.room.energyCapacityAvailable}`,
    `bucket  : ${Game.cpu.bucket.toLocaleString()}`,
    `progress:${(controller.progressTotal - controller.progress).toLocaleString()}`,
  ]);

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
