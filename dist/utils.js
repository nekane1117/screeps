"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findMyStructures = exports.getCapacityRate = void 0;
function getCapacityRate(s, type = RESOURCE_ENERGY) {
    if ("store" in s) {
        return s.store.getUsedCapacity(type) / s.store.getCapacity(type);
    }
    else {
        return Infinity;
    }
}
exports.getCapacityRate = getCapacityRate;
const findMyStructures = (room) => {
    return (room.memory.find[FIND_STRUCTURES] =
        room.memory.find[FIND_STRUCTURES] ||
            room.find(FIND_STRUCTURES).reduce((structures, s) => {
                return Object.assign(Object.assign({}, structures), { all: (structures.all || []).concat(s), [s.structureType]: (structures[s.structureType] || []).concat(s) });
            }, {
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
            }));
};
exports.findMyStructures = findMyStructures;
