export function getCapacityRate(s: AnyCreep | Structure, type?: ResourceConstant | undefined) {
  if ("store" in s) {
    return (s.store.getUsedCapacity(type) ?? 0) / (s.store.getCapacity(type) ?? 1);
  } else {
    return Infinity;
  }
}
