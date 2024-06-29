import { COMPRESSING_INGREDIENT, DECOMPRESSING_COMMODITIES, TERMINAL_THRESHOLD } from "./constants";
import { getTerminals, logUsage } from "./utils";
import { ObjectKeys } from "./utils.common";

/** terminal間輸送閾値 */
const TRANSFER_THRESHOLD = 1000;

export default function behaviors(terminal: Structure) {
  logUsage(`terminal:${terminal.room.name}`, () => {
    if (!isTerminal(terminal)) {
      return console.log(`${terminal.id} is not terminal`);
    }

    const memory = ((Memory.terminals = Memory.terminals || {})[terminal.id] = Memory.terminals[terminal.id] || {});

    memory.lastTrade && terminal.room.visual.text(memory.lastTrade, terminal.pos.x, terminal.pos.y, { font: 0.25, color: "#ffff00" });
    if (Game.cpu.bucket < 1000 || terminal.cooldown > 0) {
      return;
    }

    const { room } = terminal;

    // とにかくリソースを共有する
    const terminals = getTerminals();
    for (const resourceType of RESOURCES_ALL) {
      // 閾値の2倍あるときは不足してるターミナルに送る
      if (terminal.store[resourceType] > room.energyCapacityAvailable + TRANSFER_THRESHOLD * 2) {
        const transferTarget = terminals.find((t) => t.store[resourceType] < TRANSFER_THRESHOLD * 2);
        // 足らないターミナルを見つけたとき
        if (transferTarget) {
          if (terminal.send(resourceType, TRANSFER_THRESHOLD * 2, transferTarget.room.name) === OK) {
            break;
          }
        }
      }
    }

    const freeTerminal = _(terminals).find((t) => !t.cooldown && t.id !== terminal.id);
    // 対象があってエネルギーが十分あるとき
    if (
      (terminal.room.storage?.store.energy || 0) > terminal.room.energyCapacityAvailable &&
      terminal.store.energy >= TERMINAL_THRESHOLD * 2 &&
      freeTerminal &&
      freeTerminal.store.energy >= TERMINAL_THRESHOLD * 2
    ) {
      const market = Game.market;
      for (const commodity of ObjectKeys(COMMODITIES)) {
        const ingredients = COMPRESSING_INGREDIENT[commodity];
        // 対象外条件
        if (
          DECOMPRESSING_COMMODITIES.includes(commodity) || // 逆変換
          terminal.store[commodity] < TERMINAL_THRESHOLD * 2 || // 少ない
          !ingredients ||
          terminal.store[ingredients.type] > TERMINAL_THRESHOLD || // 材料がいっぱいある
          !ingredients // 変換表がない
        ) {
          continue;
        }

        // 一番高く買ってくれる注文
        const highestBuy = _(market.getAllOrders({ resourceType: commodity, type: ORDER_BUY }))
          .sortBy((o) => o.price)
          .last() as Order | undefined;

        if (highestBuy) {
          const cheapestSell = _(market.getAllOrders({ resourceType: ingredients.type, type: ORDER_SELL }))
            .filter((o) => {
              // 原材料の比率とマージンで1.2倍とってもまだ購入注文より安いやつ
              return o.price * ingredients.rate * 1.2 <= highestBuy.price;
            })
            .sortBy((o) => o.price)
            .first();

          if (cheapestSell) {
            // 実際売れる最大量は持ってる量と買いたい量の少ないほうとエネルギー上限
            const sellAmountMax = Math.min(terminal.store[commodity], highestBuy.remainingAmount, TERMINAL_THRESHOLD * 2);
            // 買い戻せる量は売ってる量と最大売った時のお金で買えるだけとエネルギー上限
            const buyAmountMax = Math.min(cheapestSell.remainingAmount, (sellAmountMax * highestBuy.price) / cheapestSell.price, TERMINAL_THRESHOLD * 2);

            // 実際売るべき量 = 買い戻す量 * 買値 / 売値
            const sellAmountActual = (buyAmountMax * cheapestSell.price) / highestBuy.price;

            if (market.deal(highestBuy.id, Math.ceil(sellAmountActual), terminal.room.name) === OK) {
              memory.lastTrade = highestBuy.resourceType;
              if (market.deal(cheapestSell.id, Math.floor(buyAmountMax), freeTerminal.room.name) == OK) {
                freeTerminal.memory.lastTrade = cheapestSell.resourceType;
              }
              break;
            }
          }
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
