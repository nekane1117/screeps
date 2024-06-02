import { TERMINAL_THRESHOLD } from "./constants";
import { RETURN_CODE_DECODER } from "./util.creep";
import { calcMaxTransferAmount, logUsage } from "./utils";

export default function behaviors(terminal: Structure) {
  logUsage(`terminal:${terminal.room.name}`, () => {
    if (!isTerminal(terminal)) {
      return console.log(`${terminal.id} is not terminal`);
    }

    if (Game.cpu.bucket < 100) {
      return;
    }

    const getRemainingTotal = (resourceType: ResourceConstant) => {
      return _(Object.values(Game.market.orders))
        .filter((o) => o.type === ORDER_SELL && o.resourceType === resourceType)
        .sum((o) => o.remainingAmount);
    };

    const getUsedCapacity = (resourceType: ResourceConstant) => {
      // 実際持ってる量に売り注文の合計を引いたものを返す
      return terminal.store[resourceType] - getRemainingTotal(resourceType);
    };

    const { room } = terminal;

    const mineral = _(room.find(FIND_MINERALS)).first();

    mineral &&
      room.visual.text(
        `${mineral.mineralType}:${getUsedCapacity(mineral.mineralType)}(${getRemainingTotal(mineral.mineralType)})`,
        terminal.pos.x,
        terminal.pos.y - 1,
        {
          align: "left",
        },
      );

    // ここから購入処理なのでcooldown有るときは終わる
    if (terminal.cooldown) {
      return ERR_TIRED;
    }
    // 基本はエネルギーを買うことを目的とする
    if (Game.market.credits > 1000000 && terminal.store.energy > room.energyCapacityAvailable && terminal.store.energy < TERMINAL_THRESHOLD) {
      // 実質一番安いオーダー
      const order = getSellOrderWithEffectivity(RESOURCE_ENERGY, terminal).max((o) => o.rate);

      if (order && order.rate > 1.5) {
        return Game.market.deal(order.id, order.amount, terminal.room.name);
      }
    }

    // 自室のミネラルをため込んでるときはとにかく売る
    if (mineral && getUsedCapacity("energy") > room.energyCapacityAvailable && getUsedCapacity(mineral.mineralType) > TERMINAL_THRESHOLD * 2) {
      // 一番高く買ってくれるオーダー
      const history = _(Game.market.getHistory(mineral.mineralType)).last();
      if (history) {
        // 平均より高い額の買い注文があるか
        const buyOrder = _(Game.market.getAllOrders({ type: ORDER_BUY, resourceType: mineral.mineralType }))
          // 部屋名がないのはよくわからないので無視する
          .filter((o) => o.roomName && o.price >= history.avgPrice)
          .max((o) => o.price) as unknown as Order | number;

        // 有る場合は今のエネルギーで支払える最大量売る
        if (!_.isNumber(buyOrder)) {
          return console.log(
            "deal",
            RETURN_CODE_DECODER[
              Game.market
                .deal(
                  buyOrder.id,
                  // オーダーの残量、支払える上限、保有上限の中で一番少ない分売る
                  Math.min(buyOrder.remainingAmount, calcMaxTransferAmount(buyOrder, terminal), getUsedCapacity(mineral.mineralType)),
                  room.name,
                )
                .toString()
            ],
            JSON.stringify(buyOrder),
          );
        } else {
          // 買い注文が無いとき

          // 平均値より高い中で一番安い注文を探す
          const minSellOrder = _(Game.market.getAllOrders({ type: ORDER_SELL, resourceType: mineral.mineralType }))
            // 部屋名がないのはよくわからないので無視する
            .filter((o) => o.roomName && o.price >= history.avgPrice)
            .min((o) => o.price);

          if (minSellOrder) {
            const price = minSellOrder.price - 0.01;
            const totalAmount = Math.min(getUsedCapacity(mineral.mineralType) - TERMINAL_THRESHOLD, Math.floor(Game.market.credits / price / 0.05));
            if (totalAmount > 1000) {
              return Game.market.createOrder({
                type: ORDER_SELL,
                resourceType: mineral.mineralType,
                price,
                // 保有量か支払手数料で払える額の少ないほう
                totalAmount: totalAmount,
                roomName: terminal.room.name,
              });
            }
          }
        }
      } else {
        console.log("no history");
      }
    }

    for (const resourceType of (Object.keys(terminal.store) as (MineralConstant | MineralCompoundConstant)[]).filter((resourceType) => {
      // とりあえず1000以上ある化合物
      return resourceType[0] === resourceType[0].toUpperCase() && resourceType.length >= 2 && getUsedCapacity(resourceType) > 1000;
    })) {
      // const ingredients = REVERSE_REACTIONS[resourceType];
      // if (!ingredients) {
      //   return console.log("化合物でない", resourceType);
      // }

      // const orders = _(ingredients)
      //   .map((ingredient) => {
      //     // 素材の売り注文の一番安いやつを探す
      //     return _(Game.market.getAllOrders({ type: ORDER_SELL, resourceType: ingredient })).min((o) => o.price);
      //   })
      //   .compact()
      //   .run();
      // if (orders.length !== 2) {
      //   return console.log("素材の売り注文がない", JSON.stringify(ingredients), JSON.stringify(orders));
      // }

      // const totalCost = _(orders).sum((o) => o.price);
      // console.log(JSON.stringify({ resourceType, totalCost }));
      const avg = _(Game.market.getHistory(resourceType)).last()?.avgPrice || Infinity;
      const order = _(Game.market.getAllOrders({ type: ORDER_BUY, resourceType }))
        .filter((o) => o.price >= avg)
        .max((o) => o.price);
      if (order) {
        const result = Game.market.deal(order.id, Math.min(order.amount, getUsedCapacity(resourceType) - 1000), terminal.room.name);
        if (result === OK) {
          return;
        }
      }
    }
  });
}

function isTerminal(s: Structure): s is StructureTerminal {
  return s.structureType === STRUCTURE_TERMINAL;
}

function getSellOrderWithEffectivity(resourceType: ResourceConstant, terminal: StructureTerminal) {
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
