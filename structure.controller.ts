import { StructureBehavior } from "./structures";
import { getCreepsInRoom } from "./util.creep";
import { getSpawnsInRoom } from "./utils";

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

  const { harvester = [], upgrader = [], carrier = [] } = getCreepsInRoom(controller.room);
  if (harvester.length > 0 && carrier.length > 0 && upgrader.length === 0 && controller.room.energyAvailable === controller.room.energyCapacityAvailable) {
    const spawn = _(getSpawnsInRoom(controller.room))
      .filter((s) => !s.spawning)
      .first();
    if (spawn) {
      spawn.spawnCreep(getUpgraderBody(controller), `U_${controller.room.name}_${Game.time}`, {
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

function getUpgraderBody(c: StructureController): BodyPartConstant[] {
  const b: BodyPartConstant[] = [WORK, WORK, WORK, MOVE];
  let total = 0;
  // 基本近くに建てるかつ
  // 稼働し始めたら動かないのでMOVEもCARRYも1個でいい
  return ([WORK, MOVE, CARRY, WORK] as BodyPartConstant[])
    .concat(
      ..._.range(50).map((i) => {
        return b[i % b.length];
      }),
    )
    .map((parts) => {
      total += BODYPART_COST[parts];
      return {
        parts,
        total,
      };
    })
    .filter((i) => {
      return i.total <= c.room.energyAvailable;
    })
    .map((i) => i.parts);
}
