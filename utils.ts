export function getCapacityRate(s: AnyCreep | Structure, type: ResourceConstant = RESOURCE_ENERGY) {
  if ("store" in s) {
    return s.store.getUsedCapacity(type) / s.store.getCapacity(type);
  } else {
    return Infinity;
  }
}
