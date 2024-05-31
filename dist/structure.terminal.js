"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const utils_1 = require("./utils");
function behaviors(terminal) {
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
    if (terminal.cooldown) {
        return ERR_TIRED;
    }
    const missingIngredient = [
        RESOURCE_HYDROGEN,
        RESOURCE_KEANIUM,
        RESOURCE_LEMERGIUM,
        RESOURCE_OXYGEN,
        RESOURCE_UTRIUM,
        RESOURCE_CATALYST,
        RESOURCE_ZYNTHIUM,
    ].find((m) => m !== (mineral === null || mineral === void 0 ? void 0 : mineral.mineralType) && terminal.store[m] < 1000);
    if (terminal.store.energy > room.energyCapacityAvailable && terminal.store.energy < constants_1.TERMINAL_THRESHOLD) {
        const order = getOrderWithEffectivity(RESOURCE_ENERGY, terminal).max((o) => o.rate);
        if (order && order.rate > 1.5) {
            Game.market.deal(order.id, order.amount, terminal.room.name);
        }
        else {
            console.log(`${terminal.room.name}:order is not effective, ${order.rate}`);
        }
    }
    else if (mineral && terminal.store.energy > room.energyCapacityAvailable && terminal.store[mineral.mineralType] > constants_1.TERMINAL_THRESHOLD) {
        const order = _(Game.market.getAllOrders({ type: ORDER_BUY, resourceType: mineral.mineralType }))
            .filter((o) => o.roomName)
            .max((o) => o.price);
        if (order) {
            Game.market.deal(order.id, Math.min(order.remainingAmount, (0, utils_1.calcMaxTransferAmount)(order, terminal), terminal.store[mineral.mineralType]), room.name);
        }
    }
    else if (missingIngredient) {
        const order = _(Game.market.getAllOrders({ type: ORDER_SELL, resourceType: missingIngredient })).min((o) => o.price);
        console.log(JSON.stringify({ order }));
        if (order) {
            Game.market.deal(order.id, Math.min(order.remainingAmount, (0, utils_1.calcMaxTransferAmount)(order, terminal)), room.name);
        }
    }
}
exports.default = behaviors;
function isTerminal(s) {
    return s.structureType === STRUCTURE_TERMINAL;
}
function getOrderWithEffectivity(resourceType, terminal) {
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
