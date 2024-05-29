import { MINERAL_THRESHOLD } from "./constants";

export default function behaviors(terminal: Structure) {
  if (!isTerminal(terminal)) {
    return console.log(`${terminal.id} is not terminal`);
  }

  const { room } = terminal;

  const mineral = _(room.find(FIND_MINERALS)).first();
  if (mineral) {
    const remainingTotal = Game.market
      .getAllOrders({
        roomName: room.name,
        resourceType: mineral.mineralType,
      })
      .reduce((total, order) => {
        return total + order.remainingAmount;
      }, 0);
    room.visual.text(`${mineral.mineralType}:${terminal.store[mineral.mineralType] - remainingTotal}(${remainingTotal})`, terminal.pos.x, terminal.pos.y - 1, {
      align: "left",
    });
    if (terminal.store[mineral.mineralType] - remainingTotal > MINERAL_THRESHOLD * 2) {
      Game.market.createOrder({
        type: ORDER_SELL,
        resourceType: mineral.mineralType,
        price: _(Game.market.getHistory(mineral.mineralType)).last().avgPrice,
        totalAmount: MINERAL_THRESHOLD,
        roomName: room.name,
      });
    }
  }
}

function isTerminal(s: Structure): s is StructureTerminal {
  return s.structureType === STRUCTURE_TERMINAL;
}
