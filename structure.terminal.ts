import { getTerminals, logUsage } from "./utils";
import { ObjectKeys } from "./utils.common";

/** terminal間輸送閾値 */
const TRANSFER_THRESHOLD = 1000;

export default function behaviors(terminal: Structure) {
  logUsage(`terminal:${terminal.room.name}`, () => {
    if (!isTerminal(terminal)) {
      return console.log(`${terminal.id} is not terminal`);
    }

    if (Game.cpu.bucket < 100 || terminal.cooldown > 0) {
      return;
    }

    const { room } = terminal;

    // とにかくリソースを共有する
    const terminals = getTerminals();
    for (const resourceType of ObjectKeys(terminal.store as { [r in ResourceConstant]: number })) {
      // 閾値の2倍あるときは不足してるターミナルに送る
      if (terminal.store[resourceType] > room.energyCapacityAvailable + TRANSFER_THRESHOLD * 2) {
        const transferTarget = terminals.find((t) => t.store[resourceType] < TRANSFER_THRESHOLD);
        // 足らないターミナルを見つけたとき
        if (transferTarget) {
          if (terminal.send(resourceType, TRANSFER_THRESHOLD, transferTarget.room.name) === OK) {
            break;
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
