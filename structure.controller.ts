import { StructureBehavior } from "./structures";
import { getCreepsInRoom, getMainSpawn } from "./util.creep";
import { findMyStructures, getSitesInRoom, getSpawnsInRoom } from "./utils";

const behavior: StructureBehavior = (controller: Structure) => {
  if (!isC(controller)) {
    return console.log("type is invalid", controller);
  }

  const showSummary = (texts: string[]) => {
    texts.forEach((text, i) => {
      const center = getMainSpawn(controller.room) || controller;
      controller.room.visual.text(text, Math.max(center.pos.x - 3, 1), Math.max(1, center.pos.y - 3 - texts.length + i), { align: "left" });
    });
  };

  showSummary([
    `energy  : ${controller.room.energyAvailable} / ${controller.room.energyCapacityAvailable}`,
    `bucket  : ${Game.cpu.bucket?.toLocaleString()}`,
    `progress:${(controller.progressTotal - controller.progress).toLocaleString()}`,
  ]);

  // upgradeのサイズを枚tick更新する
  updateUpgraderSize(controller.room);

  const { harvester = [], carrier = [] } = getCreepsInRoom(controller.room);
  const { container } = findMyStructures(controller.room);
  const containerSite = getSitesInRoom(controller.room).filter((s) => s.structureType === STRUCTURE_CONTAINER);
  // 中心地がある
  const mainSpawn = getMainSpawn(controller.room);
  if (mainSpawn) {
    // コントローラ用コンテナ(建設中含む)
    const myContainer = controller.pos.findClosestByRange([...container, ...containerSite], {
      filter: (s: StructureContainer | ConstructionSite) => controller.pos.inRangeTo(s, 3),
    });

    const upgraderBody = getUpgraderBody(controller.room);

    if (myContainer) {
      // 建設済みかつあれこれ足りてる時だけ作る
      if (harvester.length > 0 && carrier.length > 0 && upgraderBody.length && controller.room.energyAvailable === controller.room.energyCapacityAvailable) {
        const spawn = _(getSpawnsInRoom(controller.room)).find((s) => !s.spawning);
        if (spawn) {
          spawn.spawnCreep(upgraderBody, `U_${controller.room.name}_${Game.time}`, {
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

function updateUpgraderSize(room: Room) {
  const memory = room.memory;

  if (!memory.carrySize) {
    memory.carrySize = {};
  }

  if (!memory.carrySize.upgrader) {
    memory.carrySize.upgrader = 50;
  }

  const border = CREEP_LIFE_TIME / 4;
  memory.carrySize.upgrader =
    (memory.carrySize.upgrader * border +
      _(room.getEventLog())
        .map((e) => e.event === EVENT_UPGRADE_CONTROLLER && e.data.energySpent)
        .compact()
        .sum()) /
    (border + 1);
}

const SIZE_FACTOR = 2;

function getUpgraderBody(room: Room): BodyPartConstant[] {
  const { upgrader = [] } = getCreepsInRoom(room);

  // lveel 8の時は維持だけできればいいので特別に小さいのを出す
  if (room.controller?.level === 8 && upgrader.length === 0) {
    return [MOVE, WORK, CARRY];
  }

  if (upgrader.length >= 1) {
    return [];
  }

  // 実際に欲しいサイズ[((実効値 * 係数)) / 個数単位]
  const requestUnit = Math.min((room.memory.carrySize?.upgrader || 1) * SIZE_FACTOR, 20) / 3;

  let totalCost = 0;
  // 要求サイズが0以下の時は返さない
  if (requestUnit <= 0) {
    return [];
  } else {
    return _([CARRY, MOVE])
      .concat(
        ..._.range(requestUnit).map(() => {
          return [WORK, WORK, WORK, MOVE];
        }),
      )
      .flatten<BodyPartConstant>()
      .map((parts) => {
        totalCost += BODYPART_COST[parts];
        return {
          parts,
          totalCost,
        };
      })
      .filter((p) => {
        return p.totalCost <= room.energyAvailable;
      })
      .map((p) => p.parts)
      .value();
  }
}
