"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function behaviors(terminal) {
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
        if (terminal.store[mineral.mineralType] - remainingTotal > 10000) {
            Game.market.createOrder({
                type: ORDER_SELL,
                resourceType: mineral.mineralType,
                price: _(Game.market.getHistory(mineral.mineralType)).last().avgPrice,
                totalAmount: 10000,
                roomName: room.name,
            });
        }
    }
}
exports.default = behaviors;
function isTerminal(s) {
    return s.structureType === STRUCTURE_TERMINAL;
}
