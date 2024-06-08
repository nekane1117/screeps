"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const TRANSFER_THRESHOLD = 1000;
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
        if (mineral) {
            room.visual.text(`${mineral.mineralType}:${(0, utils_1.getAvailableAmount)(terminal, mineral.mineralType)}(${(0, utils_1.getOrderRemainingTotal)(terminal, mineral.mineralType)})`, terminal.pos.x, terminal.pos.y - 1, {
                align: "left",
            });
            const labs = (0, utils_1.getLabs)(terminal.room);
            const strategy = constants_1.LAB_STRATEGY[mineral.mineralType] || [];
            const finalProduct = _(strategy)
                .findLast((type) => {
                return labs.find((lab) => {
                    return (0, utils_1.isCompound)(lab.memory.expectedType) && lab.memory.expectedType === type;
                });
            });
            if (finalProduct) {
                if (terminal.store[finalProduct] > TRANSFER_THRESHOLD * 2 && terminal.store.energy >= TRANSFER_THRESHOLD * TERMINAL_SEND_COST) {
                    const sendTarget = _((0, utils_1.getTerminals)())
                        .compact()
                        .find((t) => t.store[finalProduct] < TRANSFER_THRESHOLD * 2);
                    if (sendTarget) {
                        terminal.send(finalProduct, TRANSFER_THRESHOLD, sendTarget.room.name, `send ${finalProduct} to ${sendTarget.room.name} from ${terminal.room.name}`);
                    }
                }
                const missingIngredient = strategy.find((s) => s.length === 1 && terminal.store[s] < TRANSFER_THRESHOLD / 2);
                if (missingIngredient) {
                    const lowestSell = _(Game.market.getAllOrders({ resourceType: missingIngredient, type: ORDER_SELL }))
                        .filter((o) => o.price <= _(Game.market.getHistory(finalProduct)).last().avgPrice)
                        .sortBy((o) => o.price)
                        .first();
                    if (lowestSell) {
                        Game.market.deal(lowestSell.id, Math.min(lowestSell.remainingAmount, Game.market.credits / lowestSell.price, (0, utils_1.calcMaxTransferAmount)(lowestSell, terminal)), terminal.room.name);
                    }
                }
            }
        }
        if (terminal.cooldown) {
            return ERR_TIRED;
        }
        if (mineral &&
            (0, utils_1.getAvailableAmount)(terminal, RESOURCE_ENERGY) > room.energyCapacityAvailable &&
            (0, utils_1.getAvailableAmount)(terminal, mineral.mineralType) > constants_1.TERMINAL_THRESHOLD * 2) {
            const history = _(Game.market.getHistory(mineral.mineralType)).last();
            if (history) {
                const buyOrder = _(Game.market.getAllOrders({ type: ORDER_BUY, resourceType: mineral.mineralType }))
                    .filter((o) => o.roomName && o.price >= history.avgPrice)
                    .max((o) => o.price);
                if (!_.isNumber(buyOrder)) {
                    return console.log("deal", util_creep_1.RETURN_CODE_DECODER[Game.market
                        .deal(buyOrder.id, Math.min(buyOrder.remainingAmount, (0, utils_1.calcMaxTransferAmount)(buyOrder, terminal), (0, utils_1.getAvailableAmount)(terminal, mineral.mineralType)), room.name)
                        .toString()], JSON.stringify(buyOrder));
                }
                else {
                    const minSellOrder = _(Game.market.getAllOrders({ type: ORDER_SELL, resourceType: mineral.mineralType }))
                        .filter((o) => o.roomName && o.price >= history.avgPrice)
                        .min((o) => o.price);
                    if (minSellOrder) {
                        const price = minSellOrder.price - 0.01;
                        const totalAmount = Math.min((0, utils_1.getAvailableAmount)(terminal, mineral.mineralType) - constants_1.TERMINAL_THRESHOLD, Math.floor(Game.market.credits / price / 0.05));
                        if (totalAmount > TRANSFER_THRESHOLD) {
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
            return resourceType[0] === resourceType[0].toUpperCase() && resourceType.length >= 2 && (0, utils_1.getAvailableAmount)(terminal, resourceType) > TRANSFER_THRESHOLD;
        })) {
            const avg = ((_a = _(Game.market.getHistory(resourceType)).last()) === null || _a === void 0 ? void 0 : _a.avgPrice) || Infinity;
            const order = _(Game.market.getAllOrders({ type: ORDER_BUY, resourceType }))
                .filter((o) => o.price >= avg)
                .max((o) => o.price);
            if (order) {
                const result = Game.market.deal(order.id, Math.min(order.amount, (0, utils_1.getAvailableAmount)(terminal, resourceType) - TRANSFER_THRESHOLD), terminal.room.name);
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
