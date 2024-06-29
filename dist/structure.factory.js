"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const utils_common_1 = require("./utils.common");
const THRESHOLD = 1000;
function behaviors(factory) {
    (0, utils_1.logUsage)(`factory:${factory.room.name}`, () => {
        if (!isFactory(factory)) {
            return console.log(`${factory.id} is not factory`);
        }
        if (factory.cooldown) {
            return;
        }
        (Memory.factories = Memory.factories || {})[factory.id] = Memory.factories[factory.id] = {
            expectedType: RESOURCE_BATTERY,
        };
        const commodity = _((0, utils_common_1.ObjectEntries)(COMMODITIES))
            .filter(([type, commodity]) => {
            return (type !== RESOURCE_ENERGY &&
                (commodity.level || 0) <= (factory.level || 0) &&
                factory.store[type] <= THRESHOLD * 2 &&
                (0, utils_common_1.ObjectEntries)(commodity.components).every(([resource, amount]) => factory.store[resource] >= amount));
        })
            .first();
        if (commodity) {
            factory.produce(commodity[0]);
        }
    });
}
exports.default = behaviors;
function isFactory(s) {
    return s.structureType === STRUCTURE_FACTORY;
}
