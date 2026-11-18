import { findMyStructures, getSitesInRoom, getSpawnsInRoom } from "../utils";
import { filterBodiesByCost, getCreepsInRoom, getMainSpawn } from "../utils/creep";
import { StructureBehavior } from "./util";

const behavior: StructureBehavior = (controller: Structure) => {
  if (!isC(controller)) {
    return console.log("type is invalid", controller);
  }

  const showSummary = (texts: string[]) => {
    texts.forEach((text, i) => {
      const center = getMainSpawn(controller.room) || controller;
      controller.room.visual.text(text, Math.max(center.pos.x - 3, 1), Math.max(1, center.pos.y - texts.length) + i, { align: "left" });
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
  // 中心地がある
  const mainSpawn = getMainSpawn(controller.room);
  if (mainSpawn) {
    // コントローラ用コンテナ(建設中含む)
    const myContainer = getContollerContainer(controller);

    const upgraderBody = getUpgraderBody(controller.room);

    if (myContainer) {
      // 建設済みかつあれこれ足りてる時だけ作る
      if (harvester.length > 0 && carrier.length > 0 && upgraderBody.length && controller.room.energyAvailable === controller.room.energyCapacityAvailable) {
        const spawn = _(getSpawnsInRoom(controller.room)).find((s) => !s.spawning);
        if (spawn) {
          spawn.spawnCreep(upgraderBody, `U_${controller.room.name}_${Game.time}`, {
            memory: {
              baseRoom: controller.room.name,
              mode: "G",
              role: "upgrader",
            } as UpgraderMemory,
          });
        }
      }
    } else {
      // コンテナがなければ建てる
      findControllerContainerPos(controller, mainSpawn)?.createConstructionSite(STRUCTURE_CONTAINER);
    }
  }
};

export default behavior;

/**
 * コントローラー用コンテナを建てる場所を探す
 * コントローラーから2マス以内に置けば周りのマスは全部upgradeできる範囲(3マス)に入るので、
 * その中で周りに立てるマスが一番多い(upgraderが並べる)場所を選ぶ
 * 同じ広さならメインスポーンに近い方(運搬が楽)
 */
function findControllerContainerPos(controller: StructureController, mainSpawn: StructureSpawn) {
  const room = controller.room;
  const terrain = room.getTerrain();

  // 人が立てるマスか(部屋の端・壁・通れない建物はダメ)
  const isWalkable = (x: number, y: number) => {
    return (
      x > 0 &&
      x < 49 &&
      y > 0 &&
      y < 49 &&
      terrain.get(x, y) !== TERRAIN_MASK_WALL &&
      !room.lookForAt(LOOK_STRUCTURES, x, y).some((s) => (OBSTACLE_OBJECT_TYPES as string[]).includes(s.structureType))
    );
  };

  // 周囲8マスのうち立てるマスの数
  const countSpace = (x: number, y: number) => {
    return _.sum(_.range(-1, 2), (dy) => _.range(-1, 2).filter((dx) => (dx !== 0 || dy !== 0) && isWalkable(x + dx, y + dy)).length);
  };

  return (
    _(_.range(-2, 3))
      .map((dy) => _.range(-2, 3).map((dx) => ({ x: controller.pos.x + dx, y: controller.pos.y + dy })))
      .flatten<{ x: number; y: number }>()
      .filter(({ x, y }) => isWalkable(x, y))
      .map(({ x, y }) => {
        const pos = new RoomPosition(x, y, room.name);
        return { pos, space: countSpace(x, y), range: pos.getRangeTo(mainSpawn) };
      })
      // 広さ優先、同じならspawnに近い方
      .sortBy((c) => -c.space * 100 + c.range)
      .first()?.pos
  );
}
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

function getUpgraderBody(room: Room): BodyPartConstant[] {
  const { upgrader = [] } = getCreepsInRoom(room);

  // level 8の時は維持だけできればいいので特別に小さいのを1体だけ
  if (room.controller?.level === 8) {
    return upgrader.length === 0 ? [MOVE, WORK, CARRY] : [];
  }

  // 0体の時はコンテナに関係なく最低1体(ダウングレード防止)
  if (upgrader.length === 0) {
    return filterBodiesByCost("upgrader", room.energyAvailable).bodies;
  }

  if (getControllerStockRate(room.controller) < 0.8) {
    return [];
  }

  return filterBodiesByCost("upgrader", room.energyAvailable).bodies;
}

/**
 * コントローラー用の置き場(コンテナ・リンク)にどれくらい溜まってるか
 * 溜まってる = 運搬がupgraderの消費を上回ってる
 * コンテナはcarrier、リンクは中央リンクと供給元が別なので、合計せずに一番溜まってるものの割合を返す
 */
function getControllerStockRate(controller: StructureController | undefined) {
  if (!controller) {
    return 0;
  }
  const contollerContainer = getContollerContainer(controller);
  const mainSpawn = getMainSpawn(controller.room);
  // upgraderが取りに行くリンク(spawn横の中継用は除く)
  const controllerLinks = findMyStructures(controller.room).link.filter((l) => {
    return l.pos.inRangeTo(controller, 3) && !(mainSpawn && l.pos.inRangeTo(mainSpawn, 1));
  });

  const stores = _.compact([contollerContainer && !("progress" in contollerContainer) ? contollerContainer : undefined, ...controllerLinks]);
  return _.max([0, ...stores.map((s) => s.store.energy / s.store.getCapacity(RESOURCE_ENERGY))]);
}

function getContollerContainer(controller: StructureController | undefined) {
  if (!controller) {
    return undefined;
  }
  const { container } = findMyStructures(controller.room);
  const containerSite = getSitesInRoom(controller.room).filter((s) => s.structureType === STRUCTURE_CONTAINER);
  // 中心地がある
  const mainSpawn = getMainSpawn(controller.room);
  if (mainSpawn) {
    return controller.pos.findClosestByRange([...container, ...containerSite], {
      filter: (s: StructureContainer | ConstructionSite) => controller.pos.inRangeTo(s, 3),
    });
  }
  return undefined;
}
