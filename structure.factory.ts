import { logUsage } from "./utils";
import { ObjectEntries } from "./utils.common";

/** 閾値 */
const THRESHOLD = 1000;
export default function behaviors(factory: Structure) {
  logUsage(`factory:${factory.room.name}`, () => {
    if (!isFactory(factory)) {
      return console.log(`${factory.id} is not factory`);
    }

    if (factory.cooldown) {
      return;
    }

    (Memory.factories = Memory.factories || {})[factory.id] = Memory.factories[factory.id] = {
      expectedType: RESOURCE_BATTERY,
    };

    const commodity = _(ObjectEntries(COMMODITIES))
      .filter(([type, commodity]) => {
        // レベルと材料が足りてるやつ
        return (
          type !== RESOURCE_ENERGY &&
          (commodity.level || 0) <= (factory.level || 0) &&
          factory.store[type] <= THRESHOLD * 2 &&
          ObjectEntries(commodity.components).every(([resource, amount]) => factory.store[resource] >= amount)
        );
      })
      .first();

    if (commodity) {
      factory.produce(commodity[0]);
    }
  });
}

function isFactory(s: Structure): s is StructureFactory {
  return s.structureType === STRUCTURE_FACTORY;
}
