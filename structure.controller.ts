import { StructureBehavior } from "./structures";
import { getCreepsInRoom, getMainSpawn } from "./util.creep";
import { findMyStructures, getSitesInRoom, getSpawnsInRoom } from "./utils";

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
  const { container } = findMyStructures(controller.room);
  const containerSite = getSitesInRoom(controller.room).filter((s) => s.structureType === STRUCTURE_CONTAINER);
  // 中心地がある
  const mainSpawn = getMainSpawn(controller.room);
  if (mainSpawn) {
    // コントローラ用コンテナ(建設中含む)
    const myContainer = controller.pos.findClosestByRange([...container, ...containerSite], {
      filter: (s: StructureContainer | ConstructionSite) => controller.pos.inRangeTo(s, 3),
    });
    if (myContainer) {
      // 建設済みかつあれこれ足りてる時だけ作る
      if (
        !("progress" in myContainer) &&
        myContainer.store.getFreeCapacity(RESOURCE_ENERGY) === 0 &&
        harvester.length > 0 &&
        carrier.length > 0 &&
        upgrader.length === 0 &&
        controller.room.energyAvailable === controller.room.energyCapacityAvailable
      ) {
        console.log("create upgrader");
        const spawn = _(getSpawnsInRoom(controller.room)).find((s) => !s.spawning);
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
    } else {
      // コンテナがなければ建てる
      const terrain = controller.room.getTerrain();
      const firstStep = controller.pos.findPathTo(mainSpawn).find((p) => terrain.get(p.x, p.y) !== TERRAIN_MASK_WALL);
      if (firstStep) {
        new RoomPosition(firstStep.x, firstStep.y, controller.room.name).createConstructionSite(STRUCTURE_CONTAINER);
      }
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
  // 移動効率は低めで作業効率高く
  return ([WORK, MOVE, CARRY, WORK] as BodyPartConstant[])
    .concat(
      ..._.range(50).map((i) => {
        return b[i % b.length];
      }),
    )
    .slice(0, 50)
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
