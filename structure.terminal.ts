import { TERMINAL_THRESHOLD } from "./constants";
import { RETURN_CODE_DECODER } from "./util.creep";
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
  ].filter((m) => m !== mineral?.mineralType && terminal.store[m] < 1000);

  // 基本はエネルギーを買うことを目的とする
  if (terminal.store.energy > room.energyCapacityAvailable && terminal.store.energy < TERMINAL_THRESHOLD) {
    // 実質一番安いオーダー
    const order = getOrderWithEffectivity(RESOURCE_ENERGY, terminal).max((o) => o.rate);

    if (order && order.rate > 1.5) {
      return Game.market.deal(order.id, order.amount, terminal.room.name);
    } else {
      console.log(`${terminal.room.name}:order is not effective, ${order.rate}`);
    }
  }
  // 自室のミネラルをため込んでるときはとにかく売る
  if (mineral && terminal.store.energy > room.energyCapacityAvailable && terminal.store[mineral.mineralType] > TERMINAL_THRESHOLD) {
    // 一番高く買ってくれるオーダー
    const order = _(Game.market.getAllOrders({ type: ORDER_BUY, resourceType: mineral.mineralType }))
      // 部屋名がないのはよくわからないので無視する
      .filter((o) => o.roomName)
      .max((o) => o.price);

    // 今のエネルギーで支払える最大量
    if (order) {
      return Game.market.deal(
        order.id,
        // オーダーの残量、支払える上限、保有上限の中で一番少ない分売る
        Math.min(order.remainingAmount, calcMaxTransferAmount(order, terminal), terminal.store[mineral.mineralType]),
        room.name,
      );
    }
  }
  // 不足してる原材料は買っておく
  if (missingIngredient.length) {
    // とにかく一番安いのを買う
    missingIngredient.forEach((ingredient) => {
      const order = getOrderWithEffectivity(ingredient, terminal).min((o) => o.price);

      if (order) {
        const maxTransferAmount = calcMaxTransferAmount(order, terminal);
        const maxCredits = Game.market.credits / order.price;
        const amount = Math.min(order.remainingAmount, maxTransferAmount, maxCredits);

        if (amount > 100) {
          const dealt = Game.market.deal(
            order.id,
            // オーダーの残量、輸送上限、支払える上限中で一番少ない分買う
            Math.min(order.remainingAmount, calcMaxTransferAmount(order, terminal), Game.market.credits / order.price),
            room.name,
          );
          if (dealt !== OK) {
            console.log(RETURN_CODE_DECODER[dealt.toString()]);
          }
        } else {
          console.log(
            "not enough credits",
            JSON.stringify({
              remainingAmount: order.remainingAmount,
              maxTransferAmount,
              maxCredits,
            }),
          );
        }
      }
    });
  }
  for (const resourceType of (Object.keys(terminal.store) as ResourceConstant[]).filter((resourceType) => {
    // とりあえず1000以上ある化合物
    return resourceType[0] === resourceType[0].toUpperCase() && resourceType.length >= 2 && terminal.store[resourceType] > 1100;
  })) {
    const order = _(Game.market.getAllOrders({ type: ORDER_BUY, resourceType })).max((o) => o.price);
    const result = Game.market.deal(order.id, Math.min(order.amount, terminal.store[resourceType] - 1000), terminal.room.name);
    if (result === OK) {
      return;
    } else {
      console.log(RETURN_CODE_DECODER[result.toString()], JSON.stringify(order));
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
