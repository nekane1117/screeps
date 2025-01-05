"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = behaviors;
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const utils_common_1 = require("./utils.common");
const TRANSFER_THRESHOLD = 1000;
function behaviors(terminal) {
    (0, utils_1.logUsage)(`terminal:${terminal.room.name}`, () => {
        var _a;
        if (!isTerminal(terminal)) {
            return console.log(`${terminal.id} is not terminal`);
        }
        const memory = ((Memory.terminals = Memory.terminals || {})[terminal.id] = Memory.terminals[terminal.id] || {});
        memory.lastTrade && terminal.room.visual.text(memory.lastTrade, terminal.pos.x, terminal.pos.y, { font: 0.25, color: "#ffff00" });
        if (Game.cpu.bucket < 1000 || terminal.cooldown > 0) {
            return;
        }
        const { room } = terminal;
        const terminals = (0, utils_1.getTerminals)();
        for (const resourceType of RESOURCES_ALL) {
            if (terminal.store[resourceType] > room.energyCapacityAvailable + TRANSFER_THRESHOLD * 2) {
                const transferTarget = terminals.find((t) => t.store[resourceType] < TRANSFER_THRESHOLD * 2);
                if (transferTarget) {
                    if (terminal.send(resourceType, TRANSFER_THRESHOLD * 2, transferTarget.room.name) === OK) {
                        break;
                    }
                }
            }
        }
        const freeTerminal = _(terminals).find((t) => !t.cooldown && t.id !== terminal.id);
        if ((((_a = terminal.room.storage) === null || _a === void 0 ? void 0 : _a.store.energy) || 0) > terminal.room.energyCapacityAvailable &&
            terminal.store.energy >= constants_1.TERMINAL_THRESHOLD * 2 &&
            freeTerminal &&
            freeTerminal.store.energy >= constants_1.TERMINAL_THRESHOLD * 2) {
            const market = Game.market;
            for (const commodity of (0, utils_common_1.ObjectKeys)(COMMODITIES)) {
                const ingredients = constants_1.COMPRESSING_INGREDIENT[commodity];
                if (constants_1.DECOMPRESSING_COMMODITIES.includes(commodity) ||
                    terminal.store[commodity] < constants_1.TERMINAL_THRESHOLD * 2 ||
                    !ingredients ||
                    terminal.store[ingredients.type] > constants_1.TERMINAL_THRESHOLD ||
                    !ingredients) {
                    continue;
                }
                const highestBuy = _(market.getAllOrders({ resourceType: commodity, type: ORDER_BUY }))
                    .sortBy((o) => o.price)
                    .last();
                if (highestBuy) {
                    const cheapestSell = _(market.getAllOrders({ resourceType: ingredients.type, type: ORDER_SELL }))
                        .filter((o) => {
                        return o.price * ingredients.rate * 1.2 <= highestBuy.price;
                    })
                        .sortBy((o) => o.price)
                        .first();
                    if (cheapestSell) {
                        const sellAmountMax = Math.min(terminal.store[commodity], highestBuy.remainingAmount, constants_1.TERMINAL_THRESHOLD * 2);
                        const buyAmountMax = Math.min(cheapestSell.remainingAmount, (sellAmountMax * highestBuy.price) / cheapestSell.price, constants_1.TERMINAL_THRESHOLD * 2);
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
function isTerminal(s) {
    return s.structureType === STRUCTURE_TERMINAL;
}
