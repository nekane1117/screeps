import { TERMINAL_THRESHOLD } from "./constants";
import { calcMaxTransferAmount } from "./utils";

export default function behaviors(terminal: Structure) {
  if (!isTerminal(terminal)) {
    return console.log(`${terminal.id} is not terminal`);
  }

  const { room } = terminal;

  const mineral = _(room.find(FIND_MINERALS)).first();

  if (Game.cpu.bucket < 100) {
    return;
  }

  mineral &&
    room.visual.text(`${mineral.mineralType}:${terminal.store[mineral.mineralType]}`, terminal.pos.x, terminal.pos.y - 1, {
      align: "left",
    });

  // ここから購入処理なのでcooldown有るときは終わる
  if (terminal.cooldown) {
    return ERR_TIRED;
  }
  // 不足してる原材料
  const missingIngredient = [
    RESOURCE_HYDROGEN,
    RESOURCE_KEANIUM,
    RESOURCE_LEMERGIUM,
    RESOURCE_OXYGEN,
    RESOURCE_UTRIUM,
    RESOURCE_CATALYST,
    RESOURCE_ZYNTHIUM,
  ].find((m) => m !== mineral?.mineralType && terminal.store[m] < 1000);

  // 基本はエネルギーを買うことを目的とする
  if (terminal.store.energy > room.energyCapacityAvailable && terminal.store.energy < TERMINAL_THRESHOLD) {
    // 実質一番安いオーダー
    const order = getOrderWithEffectivity(RESOURCE_ENERGY, terminal).max((o) => o.rate);

    if (order && order.rate > 1.5) {
      Game.market.deal(order.id, order.amount, terminal.room.name);
    } else {
      console.log(`${terminal.room.name}:order is not effective, ${order.rate}`);
    }
  }
  // 自室のミネラルをため込んでるときはとにかく売る
  else if (mineral && terminal.store.energy > room.energyCapacityAvailable && terminal.store[mineral.mineralType] > TERMINAL_THRESHOLD) {
    // 一番高く買ってくれるオーダー
    const order = _(Game.market.getAllOrders({ type: ORDER_BUY, resourceType: mineral.mineralType }))
      // 部屋名がないのはよくわからないので無視する
      .filter((o) => o.roomName)
      .max((o) => o.price);

    // 今のエネルギーで支払える最大量
    if (order) {
      Game.market.deal(
        order.id,
        // オーダーの残量、支払える上限、保有上限の中で一番少ない分売る
        Math.min(order.remainingAmount, calcMaxTransferAmount(order, terminal), terminal.store[mineral.mineralType]),
        room.name,
      );
    }
  }
  // 不足してる原材料は買っておく
  else if (missingIngredient) {
    // とにかく一番安いのを買う
    const order = _(Game.market.getAllOrders({ type: ORDER_SELL, resourceType: missingIngredient })).min((o) => o.price);
    console.log(JSON.stringify({ order }));
    if (order) {
      Game.market.deal(
        order.id,
        // オーダーの残量、支払える上限中で一番少ない分買う
        Math.min(order.remainingAmount, calcMaxTransferAmount(order, terminal)),
        room.name,
      );
    }
  }
}

function isTerminal(s: Structure): s is StructureTerminal {
  return s.structureType === STRUCTURE_TERMINAL;
}

function getOrderWithEffectivity(resourceType: ResourceConstant, terminal: StructureTerminal) {
  return _(
    Game.market.getAllOrders({ type: ORDER_SELL, resourceType }).map((order) => {
      // 今買える量(販売量、保有金額、輸送可能量)
      const amount = Math.min(order.remainingAmount, Game.market.credits / order.price, calcMaxTransferAmount(order, terminal));

      // 実コスト
      const cost = order.roomName ? Game.market.calcTransactionCost(amount, order.roomName, terminal.room.name) : amount;
      return Object.assign(order, {
        amount,
        cost,
        actual: amount - cost,
        rate: amount / cost,
      });
    }),
  );
}
