"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const TRANSFER_THRESHOLD = 1000;
function behaviors(terminal) {
    (0, utils_1.logUsage)(`terminal:${terminal.room.name}`, () => {
        var _a, _b;
        if (!isTerminal(terminal)) {
            return console.log(`${terminal.id} is not terminal`);
        }
        if (Game.cpu.bucket < 100) {
            return;
        }
        const { room } = terminal;
        const mineral = _(room.find(FIND_MINERALS)).first();
        if (mineral) {
            room.visual.text(`${mineral.mineralType}:${(0, utils_1.getAvailableAmount)(terminal, mineral.mineralType)}(${(0, utils_1.getOrderRemainingTotal)(terminal, mineral.mineralType)})`, terminal.pos.x, terminal.pos.y, {
                align: "left",
                font: 0.25,
            });
            const labs = (0, utils_1.getLabs)(terminal.room);
            const strategy = constants_1.LAB_STRATEGY[mineral.mineralType] || [];
            const finalProduct = _(strategy)
                .findLast((type) => {
                return labs.find((lab) => {
                    return (0, utils_1.isCompound)(lab.memory.expectedType) && lab.memory.expectedType === type;
                });
            });
            if (terminal.store.energy < TRANSFER_THRESHOLD) {
                (_a = _((0, utils_1.getTerminals)())
                    .filter((t) => t.store.energy > t.room.energyCapacityAvailable * 2)
                    .sort((t) => t.store.energy)
                    .last()) === null || _a === void 0 ? void 0 : _a.send(RESOURCE_ENERGY, TRANSFER_THRESHOLD, terminal.room.name, `${terminal.room.name}にエネルギー補充`);
            }
            if (finalProduct) {
                if (terminal.store[finalProduct] > TRANSFER_THRESHOLD * 2 && terminal.store.energy >= TRANSFER_THRESHOLD * TERMINAL_SEND_COST) {
                    const sendTarget = _((0, utils_1.getTerminals)()).find((t) => (0, utils_1.getAvailableAmount)(t, finalProduct) < TRANSFER_THRESHOLD);
                    if (sendTarget) {
                        terminal.send(finalProduct, TRANSFER_THRESHOLD, sendTarget.room.name, `send ${finalProduct} to ${sendTarget.room.name} from ${terminal.room.name}`);
                    }
                }
                const missingIngredient = strategy.find((s) => s.length === 1 && terminal.store[s] < TRANSFER_THRESHOLD / 2);
                if (missingIngredient) {
                    const redundantTerminal = _((0, utils_1.getTerminals)())
                        .sortBy((t) => (0, utils_1.getAvailableAmount)(t, missingIngredient) > TRANSFER_THRESHOLD * 2)
                        .last();
                    if (redundantTerminal) {
                        redundantTerminal.send(missingIngredient, TRANSFER_THRESHOLD, `${missingIngredient} を ${redundantTerminal.pos.roomName} から ${terminal.room.name} に補充`);
                    }
                    else {
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
        }
        if (terminal.cooldown) {
            return ERR_TIRED;
        }
        for (const resourceType of Object.keys(terminal.store).filter((resourceType) => {
            return resourceType[0] === resourceType[0].toUpperCase() && resourceType.length >= 2 && (0, utils_1.getAvailableAmount)(terminal, resourceType) > TRANSFER_THRESHOLD;
        })) {
            const avg = ((_b = _(Game.market.getHistory(resourceType)).last()) === null || _b === void 0 ? void 0 : _b.avgPrice) || Infinity;
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
