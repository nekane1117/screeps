import { findMyStructures, getSitesInRoom, getSpawnsInRoom } from "../utils";
import { filterBodiesByCost, getCreepsInRoom, getMainSpawn, toColor } from "../utils/creep";
import { StructureBehavior } from "./util";

const behavior: StructureBehavior = (controller: Structure) => {
  if (!isC(controller)) {
    return console.log("type is invalid", controller);
  }

  const showSummary = (texts: (string | undefined)[]) => {
    const actual = _.compact(texts);
    actual.forEach((text, i) => {
      const center = getMainSpawn(controller.room) || controller;
      controller.room.visual.text(
        text,
        Math.max(Math.min(center.pos.x - 3, 50 - Math.max(...texts.map((t) => t?.length || 0)) / 3), 1),
        Math.max(1, center.pos.y - actual.length) + i,
        { align: "left" },
      );
    });
  };

  controller.room.visual.rect(controller.pos.x - 3.5, controller.pos.y - 3.5, 7, 7, {
    lineStyle: "dotted",
    fill: "",
    stroke: toColor(controller),
  });

  const upgradeRate = controller.room.memory.analysis?.upgradePerTick || 0;
  const buildRate = controller.room.memory.analysis?.buildPerTick || 0;
  const income = findMyStructures(controller.room).source.length * (SOURCE_ENERGY_CAPACITY / ENERGY_REGEN_TIME);
  const upgradeRemain = controller.progressTotal - controller.progress;
  const sites = getSitesInRoom(controller.room);
  const buildRemain = _.sum(sites, (s) => s.progressTotal - s.progress);
  showSummary([
    `energy  : ${controller.room.energyAvailable} / ${controller.room.energyCapacityAvailable}`,
    `bucket  : ${Game.cpu.bucket?.toLocaleString()}`,
    `progress:${(controller.progressTotal - controller.progress).toLocaleString()}`,
    `upgrade : ${upgradeRate.toFixed(1)}/t (${Math.round((upgradeRate / income) * 100)}%) ETA ${upgradeRate > 0 ? `${Math.round(upgradeRemain / upgradeRate).toLocaleString()}t${Memory.msPerTick ? ` (${(((upgradeRemain / upgradeRate) * Memory.msPerTick) / 3600000).toFixed(1)}h)` : ""}` : "-"}`,
    sites.length
      ? `build : ${buildRate.toFixed(1)}/t (${Math.round((buildRate / income) * 100)}%) ETA ${buildRate > 0 ? `${Math.round(buildRemain / buildRate).toLocaleString()}t${Memory.msPerTick ? ` (${(((buildRemain / buildRate) * Memory.msPerTick) / 3600000).toFixed(1)}h)` : ""}` : "-"}`
      : undefined,
    `tick    : ${Memory.msPerTick ? `${(Memory.msPerTick / 1000).toFixed(2)}s (${Math.round(3600000 / Memory.msPerTick).toLocaleString()}/h)` : "-"}`,
  ]);

  // upgradeのサイズを枚tick更新する
  updateEventAnalysis(controller.room);

  const { harvester = [], carrier = [], upgradeHauler = [] } = getCreepsInRoom(controller.room);
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

      // 居ないかつコンテナができてて空いているかつストレージにいっぱいあるときはもっと持ってこさせる
      if (
        upgradeHauler.length == 0 &&
        getSitesInRoom(controller.room).length === 0 &&
        controller.room.energyAvailable === controller.room.energyCapacityAvailable &&
        "store" in myContainer &&
        myContainer.store.energy / myContainer.store.getCapacity(RESOURCE_ENERGY) < 0.2
      ) {
        const spawn = _(getSpawnsInRoom(controller.room)).find((s) => !s.spawning);

        // 往復分(バッファ1.5倍)を持った最大のボディを作る
        const maxBody: BodyPartConstant[] = [MOVE, WORK];
        for (let i = 1; i < controller.pos.getRangeTo(mainSpawn) * 2 * 1.5; i++) {
          maxBody.push(MOVE, CARRY);
        }

        // この部屋で実際に作れる大きさ
        let cost = 0;
        const body = maxBody.filter((b) => {
          cost += BODYPART_COST[b];
          return cost <= controller.room.energyAvailable;
        });

        if (spawn && body.length > 0) {
          spawn.spawnCreep(body, `Uh_${controller.room.name}_${Game.time}`, {
            memory: {
              baseRoom: controller.room.name,
              controllerId: controller.id,
              mode: "G",
              role: "upgradeHauler",
            } as UpgradeHaulerMemory,
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

function updateEventAnalysis(room: Room) {
  const memory = room.memory;

  if (!memory.analysis) {
    memory.analysis = {};
  }

  if (!memory.analysis.upgradePerTick) {
    memory.analysis.upgradePerTick = 0;
  }

  if (!memory.analysis.buildPerTick) {
    memory.analysis.buildPerTick = 0;
  }

  const border = CREEP_LIFE_TIME / 4;
  const spent = room.getEventLog().reduce(
    (a, c) => {
      switch (c.event) {
        case EVENT_BUILD:
          a[EVENT_BUILD] += c.data.amount;
          break;
        case EVENT_UPGRADE_CONTROLLER:
          a[EVENT_UPGRADE_CONTROLLER] += c.data.energySpent;
          break;
        default:
          break;
      }
      return a;
    },
    {
      [EVENT_ATTACK]: 0,
      [EVENT_OBJECT_DESTROYED]: 0,
      [EVENT_ATTACK_CONTROLLER]: 0,
      [EVENT_BUILD]: 0,
      [EVENT_HARVEST]: 0,
      [EVENT_HEAL]: 0,
      [EVENT_REPAIR]: 0,
      [EVENT_RESERVE_CONTROLLER]: 0,
      [EVENT_UPGRADE_CONTROLLER]: 0,
      [EVENT_EXIT]: 0,
      [EVENT_POWER]: 0,
      [EVENT_TRANSFER]: 0,
    },
  );

  memory.analysis.upgradePerTick = (memory.analysis.upgradePerTick * border + spent[EVENT_UPGRADE_CONTROLLER]) / (border + 1);
  memory.analysis.buildPerTick = (memory.analysis.buildPerTick * border + spent[EVENT_BUILD]) / (border + 1);
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
