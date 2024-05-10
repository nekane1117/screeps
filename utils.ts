export function getCapacityRate(s: AnyCreep | Structure, type: ResourceConstant = RESOURCE_ENERGY) {
  if ("store" in s) {
    return s.store.getUsedCapacity(type) / s.store.getCapacity(type);
  } else {
    return Infinity;
  }
}

export const findMyStructures = (room: Room) => {
  return (room.memory.find[FIND_STRUCTURES] =
    room.memory.find[FIND_STRUCTURES] ||
    room.find(FIND_STRUCTURES).reduce(
      (structures, s) => {
        return {
          ...structures,
          all: (structures.all || []).concat(s),
          [s.structureType]: (structures[s.structureType] || []).concat(s),
        };
      },
      {
        all: [],
        constructedWall: [],
        container: [],
        controller: [],
        extension: [],
        extractor: [],
        factory: [],
        invaderCore: [],
        keeperLair: [],
        lab: [],
        link: [],
        nuker: [],
        observer: [],
        portal: [],
        powerBank: [],
        powerSpawn: [],
        rampart: [],
        road: [],
        spawn: [],
        storage: [],
        terminal: [],
        tower: [],
      } as MyStructureCache,
    ));
};
