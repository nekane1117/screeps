import { findMyStructures, getSpawnsInRoom, logUsage } from "../utils";
import { getCreepsInRoom, getMainSpawn, RETURN_CODE_DECODER } from "../utils/creep";

export default function behaviors(source: Source) {
  // 自分用harvester管理
  manageHarvester(source);
  // hauler管理
  manageHauler(source);
}

/**
 * 固定harvesterボディ  
 */
const HARVESTER_FIXED_BODY = [WORK, MOVE, CARRY, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];

function getBodies(cost: number) {
  let total = 0;

  return HARVESTER_FIXED_BODY.filter((b) => {
    total += BODYPART_COST[b];
    // harvesterは最優先で作るつくりなので上限を見る
    // 一応下限としてSpawnの最低初期値300を入れておく
    return total <= cost;
  });
}

/**
 * harvester管理
 * 今はとりあえず存在チェックして作るだけ
 * @param source
 * @returns
 */
function manageHarvester(source: Source) {
  const room: Readonly<Room> = source.room;
  const { harvester: allHarvester = [] } = getCreepsInRoom(room);

  // harvester存在チェック
  const harvester = allHarvester.filter((h) => {
    // 自分を見ていてまだ生きてるやつ
    // 寿命が最大bodyの生成時間 + 25(適当にマップの半分)を切ったら交代要員を作る
    // 生成中はticksToLiveが無いので生きてる扱い
    return h.memory.harvestTargetId === source.id && (h.ticksToLive ?? Infinity) > HARVESTER_FIXED_BODY.length * CREEP_SPAWN_TIME + 25;
  });

  if (harvester.length) {
    // いるならOK
    return OK;
  }

  const spawn = findSpawn(source);
  if (!spawn) {
    // spawnが見つからない
    return ERR_NOT_ENOUGH_RESOURCES;
  }

  // 以降は(他の部屋の場合もあるので)spawnの部屋のエネルギーで判定する
  const spawnRoom = spawn.room;
  /**
   * 次作る予定のbodies(最低は300コストのはず)
   * 部屋に1体もいないときは収入が無くて満タンにならないので、今あるだけで作る(spawnの自然回復分300が下限)
   */
  const bodies = getBodies(allHarvester.length === 0 ? Math.max(spawnRoom.energyAvailable, SPAWN_ENERGY_CAPACITY) : spawnRoom.energyCapacityAvailable);
  /** 実際に必要なコスト */
  const actualCost = _.sum(bodies, (b) => BODYPART_COST[b]);
  if (spawnRoom.energyAvailable < actualCost) {
    // エネルギーが足らなければスルー
    return ERR_NOT_ENOUGH_ENERGY;
  }

  const name = `H_${room.name}_${Game.time}`;
  const spawned = spawn.spawnCreep(bodies, name, {
    memory: {
      role: "harvester",
      baseRoom: room.name,
      harvestTargetId: source.id,
    } as HarvesterMemory,
  });
  if (spawned !== OK) {
    console.log(`spawn ${spawn.name}:${RETURN_CODE_DECODER[spawned]}: ${JSON.stringify(bodies)}`);
  }
  return spawned;
}

/**
 * harvesterを作るspawnを探す
 * 部屋にある時は部屋のだけ、無いときは満タンの部屋の中で一番近いやつ
 */
function findSpawn(source: Source) {
  const spawns = getSpawnsInRoom(source.room);
  if (spawns.length > 0) {
    return spawns.find((s) => !s.spawning);
  }
  return logUsage(
    "find spawn",
    () =>
      _(Object.values(Game.spawns))
        .filter((s) => !s.spawning && s.room.energyAvailable === s.room.energyCapacityAvailable)
        .map((spawn) => {
          return {
            spawn,
            cost: PathFinder.search(source.pos, spawn.pos).cost,
          };
        })
        .min((v) => v.cost).spawn,
  );
}

function manageHauler(source: Source) {
  const { harvester: allHarvester = [], hauler: allHauler = [] } = getCreepsInRoom(source.room);

  // harvester存在チェック
  const harvester = allHarvester.filter((h) => {
    // 自分を見ていてまだ生きてるやつ
    // 寿命が最大bodyの生成時間 + 25(適当にマップの半分)を切ったら交代要員を作る
    // 生成中はticksToLiveが無いので生きてる扱い
    return h.memory.harvestTargetId === source.id && (h.ticksToLive ?? Infinity) > HARVESTER_FIXED_BODY.length * CREEP_SPAWN_TIME + 25;
  });

  if (harvester.length === 0) {
    // 居ないときは作らない
    return ERR_NOT_ENOUGH_RESOURCES;
  }
  // 距離
  const dist = getMainSpawn(source.room)?.pos.getRangeTo(source) || 25;

  /** 予定容量(距離 * 2(往復) * 10(1tickあたり) * 1.5 (適当にバッファ)) */
  const requestCapacity = Math.floor(dist * 2 * 10 * 1.5);

  const requestBodies = getRequestHaulerBody(requestCapacity);

  const hauler = allHauler.filter((h) => {
    // 自分を見ていてまだ生きてるやつ
    return h.memory.sourceId === source.id && (h.ticksToLive || Infinity) > requestBodies.length * CREEP_SPAWN_TIME + 25;
  });

  // いるならOK
  if (hauler.length) {
    return OK;
  }

  const { container = [] } = findMyStructures(source.room);

  // 落ちてるリソースがあるか
  const filled = source.pos.findInRange(container, 1, {
    filter: (s) => s.store.energy / s.store.getCapacity(RESOURCE_ENERGY) > 0.5,
  });

  // ないならOK
  if (filled.length === 0) {
    return OK;
  }

  const spawn = findSpawn(source);

  if (!spawn) {
    // spawnが見つからない
    return ERR_NOT_ENOUGH_RESOURCES;
  }

  let totalCost = 0;
  // 実際に作れる大きさ
  const actualBody = requestBodies.filter((b) => {
    return (totalCost += BODYPART_COST[b]) <= spawn.room.energyCapacityAvailable;
  });
  if (actualBody.at(-1) === CARRY) {
    actualBody.pop();
  }
  const name = `Ha_${source.room.name}_${Game.time}`;
  const spawned = spawn.spawnCreep(actualBody, name, {
    memory: {
      role: "hauler",
      mode: "G",
      baseRoom: source.room.name,
      sourceId: source.id,
      targetId: filled.at(0)?.id,
    } as HaulerMemory,
  });
  if (spawned !== OK) {
    console.log(`spawn ${spawn.name}:${RETURN_CODE_DECODER[spawned]}: ${JSON.stringify(actualBody)}`);
  }
  return spawned;
}

function getRequestHaulerBody(requestCapacity: number) {
  const bodies: BodyPartConstant[] = [WORK];
  let total = 0;
  while (total <= requestCapacity) {
    bodies.push(MOVE, CARRY);
    total += CARRY_CAPACITY;
  }
  return bodies.slice(0, 50);
}
