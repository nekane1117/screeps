import { logUsage } from "./utils";
import { ObjectEntries } from "./utils.common";

/** 閾値 */
const THRESHOLD = FACTORY_CAPACITY / RESOURCES_ALL.length;
export default function behaviors(factory: Structure) {
  logUsage(`factory:${factory.room.name}`, () => {
    if (!isFactory(factory)) {
      return console.log(`${factory.id} is not factory`);
    }

    const memory: FactoryMemory = ((Memory.factories = Memory.factories || {})[factory.id] = Memory.factories[factory.id] || {});
    memory.lastProduced &&
      factory.room.visual.text(memory.lastProduced, factory.pos.x, factory.pos.y, {
        color: "white",
        font: 0.25,
      });

    if (factory.cooldown) {
      return;
    }

    const commodity = _(ObjectEntries(COMMODITIES))
      .filter(([type, commodity]) => {
        // レベルと材料が足りてるやつ
        return (
          !INGREDIENTS.includes(type) &&
          (commodity.level || 0) <= (factory.level || 0) &&
          factory.store[type] <= THRESHOLD &&
          ObjectEntries(commodity.components).every(([resource, amount]) => factory.store[resource] >= amount)
        );
      })
      .sortBy(([_type, commodity]) => {
        return -(commodity.level || 0) * FACTORY_CAPACITY;
      })
      .first();

    if (commodity) {
      factory.produce(commodity[0]);
      memory.lastProduced = commodity[0];
    }
  });
}

function isFactory(s: Structure): s is StructureFactory {
  return s.structureType === STRUCTURE_FACTORY;
}

/**
 * 基礎素材
 */
const INGREDIENTS: ResourceConstant[] = [
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
  RESOURCE_CATALYST,
  RESOURCE_GHODIUM,
];
