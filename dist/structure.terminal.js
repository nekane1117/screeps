"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const utils_1 = require("./utils");
function behaviors(terminal) {
    (0, utils_1.logUsage)(`terminal:${terminal.room.name}`, () => {
        var _a;
        if (!isTerminal(terminal)) {
            return console.log(`${terminal.id} is not terminal`);
        }
        if (Game.cpu.bucket < 100) {
            return;
        }
        const { room } = terminal;
        const mineral = _(room.find(FIND_MINERALS)).first();
        mineral &&
            room.visual.text(`${mineral.mineralType}:${terminal.store[mineral.mineralType]}`, terminal.pos.x, terminal.pos.y - 1, {
                align: "left",
            });
        if (terminal.cooldown) {
            return ERR_TIRED;
        }
        if (Game.market.credits > 1000000 && terminal.store.energy > room.energyCapacityAvailable && terminal.store.energy < constants_1.TERMINAL_THRESHOLD) {
            const order = getSellOrderWithEffectivity(RESOURCE_ENERGY, terminal).max((o) => o.rate);
            if (order && order.rate > 1.5) {
                return Game.market.deal(order.id, order.amount, terminal.room.name);
            }
        }
        for (const resourceType of Object.keys(terminal.store).filter((resourceType) => {
            return resourceType[0] === resourceType[0].toUpperCase() && resourceType.length >= 2 && terminal.store[resourceType] > 1000;
        })) {
            const avg = ((_a = _(Game.market.getHistory(resourceType)).last()) === null || _a === void 0 ? void 0 : _a.avgPrice) || Infinity;
            const order = _(Game.market.getAllOrders({ type: ORDER_BUY, resourceType }))
                .filter((o) => o.price >= avg)
                .max((o) => o.price);
            if (order) {
                const result = Game.market.deal(order.id, Math.min(order.amount, terminal.store[resourceType] - 1000), terminal.room.name);
                if (result === OK) {
                    return;
                }
            }
        }
    });
}
exports.default = behaviors;
function isTerminal(s) {
    return s.structureType === STRUCTURE_TERMINAL;
}
function getSellOrderWithEffectivity(resourceType, terminal) {
    return _(Game.market.getAllOrders({ type: ORDER_SELL, resourceType }).map((order) => {
        const amount = Math.min(order.remainingAmount, Game.market.credits / order.price, (0, utils_1.calcMaxTransferAmount)(order, terminal));
        const cost = order.roomName ? Game.market.calcTransactionCost(amount, order.roomName, terminal.room.name) : amount;
        return Object.assign(order, {
            amount,
            cost,
            actual: amount - cost,
            rate: amount / cost,
        });
    }));
}
