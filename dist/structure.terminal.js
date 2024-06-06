"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const TRADE_THRESHOLD = 1000;
function behaviors(terminal) {
    (0, utils_1.logUsage)(`terminal:${terminal.room.name}`, () => {
        var _a;
        if (!isTerminal(terminal)) {
            return console.log(`${terminal.id} is not terminal`);
        }
        if (Game.cpu.bucket < 100) {
            return;
        }
        const getRemainingTotal = (resourceType) => {
            return _(Object.values(Game.market.orders))
                .filter((o) => o.type === ORDER_SELL && o.resourceType === resourceType)
                .sum((o) => o.remainingAmount);
        };
        const getUsedCapacity = (resourceType) => {
            return terminal.store[resourceType] - getRemainingTotal(resourceType);
        };
        const { room } = terminal;
        const mineral = _(room.find(FIND_MINERALS)).first();
        if (mineral) {
            room.visual.text(`${mineral.mineralType}:${getUsedCapacity(mineral.mineralType)}(${getRemainingTotal(mineral.mineralType)})`, terminal.pos.x, terminal.pos.y - 1, {
                align: "left",
            });
            const labs = (0, utils_1.getLabs)(terminal.room);
            const finalProduct = _(constants_1.LAB_STRATEGY[mineral.mineralType] || [])
                .reverse()
                .find((type) => {
                return labs.find((lab) => {
                    return (0, utils_1.isCompound)(lab.memory.expectedType) && lab.memory.expectedType === type;
                });
            });
            if (finalProduct && terminal.store[finalProduct] > TRADE_THRESHOLD * 2 && terminal.store.energy >= TRADE_THRESHOLD * TERMINAL_SEND_COST) {
                const sendTarget = _(Object.values(Game.rooms).map((r) => r.terminal))
                    .compact()
                    .find((t) => t.store[finalProduct] < TRADE_THRESHOLD);
                if (sendTarget) {
                    terminal.send(finalProduct, TRADE_THRESHOLD - sendTarget.store[finalProduct], sendTarget.room.name, `send ${finalProduct} to ${sendTarget.room.name} from ${terminal.room.name}`);
                }
            }
        }
        if (terminal.cooldown) {
            return ERR_TIRED;
        }
        if (Game.market.credits > 1000000 && terminal.store.energy > room.energyCapacityAvailable && terminal.store.energy < constants_1.TERMINAL_THRESHOLD) {
            const order = getSellOrderWithEffectivity(RESOURCE_ENERGY, terminal).max((o) => o.rate);
            if (order && order.rate > 1.5) {
                return Game.market.deal(order.id, order.amount, terminal.room.name);
            }
        }
        if (mineral && getUsedCapacity("energy") > room.energyCapacityAvailable && getUsedCapacity(mineral.mineralType) > constants_1.TERMINAL_THRESHOLD * 2) {
            const history = _(Game.market.getHistory(mineral.mineralType)).last();
            if (history) {
                const buyOrder = _(Game.market.getAllOrders({ type: ORDER_BUY, resourceType: mineral.mineralType }))
                    .filter((o) => o.roomName && o.price >= history.avgPrice)
                    .max((o) => o.price);
                if (!_.isNumber(buyOrder)) {
                    return console.log("deal", util_creep_1.RETURN_CODE_DECODER[Game.market
                        .deal(buyOrder.id, Math.min(buyOrder.remainingAmount, (0, utils_1.calcMaxTransferAmount)(buyOrder, terminal), getUsedCapacity(mineral.mineralType)), room.name)
                        .toString()], JSON.stringify(buyOrder));
                }
                else {
                    const minSellOrder = _(Game.market.getAllOrders({ type: ORDER_SELL, resourceType: mineral.mineralType }))
                        .filter((o) => o.roomName && o.price >= history.avgPrice)
                        .min((o) => o.price);
                    if (minSellOrder) {
                        const price = minSellOrder.price - 0.01;
                        const totalAmount = Math.min(getUsedCapacity(mineral.mineralType) - constants_1.TERMINAL_THRESHOLD, Math.floor(Game.market.credits / price / 0.05));
                        if (totalAmount > TRADE_THRESHOLD) {
                            return Game.market.createOrder({
                                type: ORDER_SELL,
                                resourceType: mineral.mineralType,
                                price,
                                totalAmount: totalAmount,
                                roomName: terminal.room.name,
                            });
                        }
                    }
                }
            }
            else {
                console.log("no history");
            }
        }
        for (const resourceType of Object.keys(terminal.store).filter((resourceType) => {
            return resourceType[0] === resourceType[0].toUpperCase() && resourceType.length >= 2 && getUsedCapacity(resourceType) > TRADE_THRESHOLD;
        })) {
            const avg = ((_a = _(Game.market.getHistory(resourceType)).last()) === null || _a === void 0 ? void 0 : _a.avgPrice) || Infinity;
            const order = _(Game.market.getAllOrders({ type: ORDER_BUY, resourceType }))
                .filter((o) => o.price >= avg)
                .max((o) => o.price);
            if (order) {
                const result = Game.market.deal(order.id, Math.min(order.amount, getUsedCapacity(resourceType) - TRADE_THRESHOLD), terminal.room.name);
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
