import { LAB_STRATEGY } from "./constants";
import { calcMaxTransferAmount, getAvailableAmount, getLabs, getOrderRemainingTotal, getTerminals, isCompound, logUsage } from "./utils";

/** terminal間輸送閾値 */
const TRANSFER_THRESHOLD = 1000;

export default function behaviors(terminal: Structure) {
  logUsage(`terminal:${terminal.room.name}`, () => {
    if (!isTerminal(terminal)) {
      return console.log(`${terminal.id} is not terminal`);
    }

    if (Game.cpu.bucket < 100) {
      return;
    }

    const { room } = terminal;

    const mineral = _(room.find(FIND_MINERALS)).first();

    if (mineral) {
      room.visual.text(
        `${mineral.mineralType}:${getAvailableAmount(terminal, mineral.mineralType)}(${getOrderRemainingTotal(terminal, mineral.mineralType)})`,
        terminal.pos.x,
        terminal.pos.y - 1,
        {
          align: "left",
        },
      );

      const labs = getLabs(terminal.room);
      const strategy = LAB_STRATEGY[mineral.mineralType] || [];
      // 現在の最終生産物を取得する
      const finalProduct = _(strategy)
        // 原料から並んでいるので後ろから探す
        .findLast((type) => {
          return labs.find((lab) => {
            // 化合物かつlabで作っている
            return isCompound(lab.memory.expectedType) && lab.memory.expectedType === type;
          });
        });

      if (terminal.store.energy < TRANSFER_THRESHOLD) {
        _(getTerminals())
          .filter((t) => t.store.energy > t.room.energyCapacityAvailable * 2)
          .sort((t) => t.store.energy)
          .last()
          ?.send(RESOURCE_ENERGY, TRANSFER_THRESHOLD, terminal.room.name, `${terminal.room.name}にエネルギー補充`);
      }

      // 最終生産物が取れたとき
      if (finalProduct) {
        // 最終生産物がいっぱいあるとき
        if (terminal.store[finalProduct] > TRANSFER_THRESHOLD * 2 && terminal.store.energy >= TRANSFER_THRESHOLD * TERMINAL_SEND_COST) {
          // 足らないterminaに送る
          const sendTarget = _(getTerminals()).find((t) => getAvailableAmount(t, finalProduct) < TRANSFER_THRESHOLD);
          if (sendTarget) {
            terminal.send(finalProduct, TRANSFER_THRESHOLD, sendTarget.room.name, `send ${finalProduct} to ${sendTarget.room.name} from ${terminal.room.name}`);
          }
        }

        // 不足している原料
        const missingIngredient = strategy.find((s) => s.length === 1 && terminal.store[s] < TRANSFER_THRESHOLD / 2);
        // 不足してる素材があるとき
        if (missingIngredient) {
          const redundantTerminal = _(getTerminals())
            .sortBy((t) => getAvailableAmount(t, missingIngredient) > TRANSFER_THRESHOLD * 2)
            .last();
          if (redundantTerminal) {
            redundantTerminal.send(
              missingIngredient,
              TRANSFER_THRESHOLD,
              `${missingIngredient} を ${redundantTerminal.pos.roomName} から ${terminal.room.name} に補充`,
            );
          } else {
            // 最終生産物の一番高い買い注文

            // 足らない素材の一番安い売り注文
            const lowestSell = _(Game.market.getAllOrders({ resourceType: missingIngredient, type: ORDER_SELL }))
              .filter((o) => o.price <= _(Game.market.getHistory(finalProduct)).last().avgPrice)
              .sortBy((o) => o.price)
              .first();
            if (lowestSell) {
              Game.market.deal(
                lowestSell.id,
                Math.min(lowestSell.remainingAmount, Game.market.credits / lowestSell.price, calcMaxTransferAmount(lowestSell, terminal)),
                terminal.room.name,
              );
            }
          }
        }
      }
    }

    // ここから購入処理なのでcooldown有るときは終わる
    if (terminal.cooldown) {
      return ERR_TIRED;
    }

    // // 自室のミネラルをため込んでるときはとにかく売る
    // if (
    //   mineral &&
    //   getAvailableAmount(terminal, RESOURCE_ENERGY) > room.energyCapacityAvailable &&
    //   getAvailableAmount(terminal, mineral.mineralType) > TERMINAL_THRESHOLD * 2
    // ) {
    //   // 一番高く買ってくれるオーダー
    //   const history = _(Game.market.getHistory(mineral.mineralType)).last();
    //   if (history) {
    //     // 平均より高い額の買い注文があるか
    //     const buyOrder = _(Game.market.getAllOrders({ type: ORDER_BUY, resourceType: mineral.mineralType }))
    //       // 部屋名がないのはよくわからないので無視する
    //       .filter((o) => o.roomName && o.price >= history.avgPrice)
    //       .max((o) => o.price) as unknown as Order | number;

    //     // 有る場合は今のエネルギーで支払える最大量売る
    //     if (!_.isNumber(buyOrder)) {
    //       return console.log(
    //         "deal",
    //         RETURN_CODE_DECODER[
    //           Game.market
    //             .deal(
    //               buyOrder.id,
    //               // オーダーの残量、支払える上限、保有上限の中で一番少ない分売る
    //               Math.min(buyOrder.remainingAmount, calcMaxTransferAmount(buyOrder, terminal), getAvailableAmount(terminal, mineral.mineralType)),
    //               room.name,
    //             )
    //             .toString()
    //         ],
    //         JSON.stringify(buyOrder),
    //       );
    //     } else {
    //       // 買い注文が無いとき

    //       // 平均値より高い中で一番安い注文を探す
    //       const minSellOrder = _(Game.market.getAllOrders({ type: ORDER_SELL, resourceType: mineral.mineralType }))
    //         // 部屋名がないのはよくわからないので無視する
    //         .filter((o) => o.roomName && o.price >= history.avgPrice)
    //         .min((o) => o.price);

    //       if (minSellOrder) {
    //         const price = minSellOrder.price - 0.01;
    //         const totalAmount = Math.min(
    //           getAvailableAmount(terminal, mineral.mineralType) - TERMINAL_THRESHOLD,
    //           Math.floor(Game.market.credits / price / 0.05),
    //         );
    //         if (totalAmount > TRANSFER_THRESHOLD) {
    //           return Game.market.createOrder({
    //             type: ORDER_SELL,
    //             resourceType: mineral.mineralType,
    //             price,
    //             // 保有量か支払手数料で払える額の少ないほう
    //             totalAmount: totalAmount,
    //             roomName: terminal.room.name,
    //           });
    //         }
    //       }
    //     }
    //   } else {
    //     console.log("no history");
    //   }
    // }

    for (const resourceType of (Object.keys(terminal.store) as (MineralConstant | MineralCompoundConstant)[]).filter((resourceType) => {
      // とりあえず1000以上ある化合物
      return resourceType[0] === resourceType[0].toUpperCase() && resourceType.length >= 2 && getAvailableAmount(terminal, resourceType) > TRANSFER_THRESHOLD;
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
        const result = Game.market.deal(order.id, Math.min(order.amount, getAvailableAmount(terminal, resourceType) - TRANSFER_THRESHOLD), terminal.room.name);
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

// function getSellOrderWithEffectivity(resourceType: ResourceConstant, terminal: StructureTerminal) {
//   return _(
//     Game.market.getAllOrders({ type: ORDER_SELL, resourceType }).map((order) => {
//       // 今買える量(販売量、保有金額、輸送可能量)
//       const amount = Math.min(order.remainingAmount, Game.market.credits / order.price, calcMaxTransferAmount(order, terminal));

//       // 実コスト
//       const cost = order.roomName ? Game.market.calcTransactionCost(amount, order.roomName, terminal.room.name) : amount;
//       return Object.assign(order, {
//         amount,
//         cost,
//         actual: amount - cost,
//         rate: amount / cost,
//       });
//     }),
//   );
// }
