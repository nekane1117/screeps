export function pickUpAll(creep: Creep) {
  return {
    [FIND_RUINS]: creep.pos.findInRange(FIND_RUINS, 1).map((t) => creep.withdraw(t, RESOURCE_ENERGY)),
    [FIND_TOMBSTONES]: creep.pos.findInRange(FIND_TOMBSTONES, 1).map((t) => creep.withdraw(t, RESOURCE_ENERGY)),
    [FIND_DROPPED_RESOURCES]: creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1).map((source) => creep.pickup(source)),
  };
}
