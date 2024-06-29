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
        const memory = ((Memory.factories = Memory.factories || {})[factory.id] = Memory.factories[factory.id] || {});
        memory.lastProduced &&
            factory.room.visual.text(memory.lastProduced, factory.pos.x, factory.pos.y, {
                color: "white",
                font: 0.25,
            });
        if (factory.cooldown) {
            return;
        }
        const commodity = _((0, utils_common_1.ObjectEntries)(COMMODITIES))
            .filter(([type, commodity]) => {
            return (!INGREDIENTS.includes(type) &&
                (commodity.level || 0) <= (factory.level || 0) &&
                factory.store[type] <= THRESHOLD * 2 &&
                (0, utils_common_1.ObjectEntries)(commodity.components).every(([resource, amount]) => factory.store[resource] >= amount));
        })
            .sortBy(([type, commodity]) => {
            return (commodity.level || 0) * FACTORY_CAPACITY + factory.store[type];
        })
            .first();
        if (commodity) {
            factory.produce(commodity[0]);
            memory.lastProduced = commodity[0];
        }
        memory.outputType = RESOURCES_ALL.find((type) => {
            if (!factory.room.terminal) {
                return false;
            }
            return !INGREDIENTS.includes(type) && factory.store[type] > THRESHOLD * 2 && factory.room.terminal.store[type] < THRESHOLD * 2;
        });
        memory.expectedType = RESOURCES_ALL.find((resourceType) => {
            var _a;
            return (((_a = factory.room.terminal) === null || _a === void 0 ? void 0 : _a.store[resourceType]) || 0) > THRESHOLD * 1 && factory.store[resourceType] < THRESHOLD;
        });
    });
}
exports.default = behaviors;
function isFactory(s) {
    return s.structureType === STRUCTURE_FACTORY;
}
const INGREDIENTS = [
    RESOURCE_ENERGY,
    RESOURCE_POWER,
    RESOURCE_METAL,
    RESOURCE_BIOMASS,
    RESOURCE_SILICON,
    RESOURCE_MIST,
    RESOURCE_OPS,
    RESOURCE_OXYGEN,
    RESOURCE_HYDROGEN,
    RESOURCE_ZYNTHIUM,
    RESOURCE_LEMERGIUM,
    RESOURCE_UTRIUM,
    RESOURCE_KEANIUM,
    RESOURCE_CRYSTAL,
];
