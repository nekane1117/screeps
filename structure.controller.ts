import { StructureBehavior } from "./structures";
import { filterBodiesByCost } from "./util.creep";
import { getCapacityRate, getSpawnsOrderdByRange } from "./utils";

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
    `bucket  : ${Game.cpu.bucket?.toLocaleString()}`,
    `progress:${(controller.progressTotal - controller.progress).toLocaleString()}`,
  ]);

  const upgrader = Object.values(Game.creeps).filter((c): c is Upgrader => {
    return c.memory.role === "upgrader" && c.memory.baseRoom === controller.pos.roomName;
  });

  const upgradeContainer = _(
    controller.pos.findInRange(FIND_STRUCTURES, 3, { filter: (s): s is StructureContainer => s.structureType === STRUCTURE_CONTAINER }),
  ).first();

  if (upgrader.length < (upgradeContainer ? getCapacityRate(upgradeContainer) / 0.9 : 1)) {
    const spawn = getSpawnsOrderdByRange(controller, 1).first();
    if (!spawn) {
      console.log(controller.room.name, "controller can't find spawn");
    } else if (spawn.room.energyAvailable < 300) {
      console.log(controller.room.name, "Not enough spawn energy");
    } else {
      spawn.spawnCreep(filterBodiesByCost("upgrader", spawn.room.energyAvailable).bodies, `U_${controller.room.name}_${Game.time}`, {
        memory: {
          baseRoom: controller.room.name,
          mode: "🛒",
          role: "upgrader",
        } as UpgraderMemory,
      });
    }
  }
};

export default behavior;
function isC(s: Structure): s is StructureController {
  return s.structureType === STRUCTURE_CONTROLLER;
}
