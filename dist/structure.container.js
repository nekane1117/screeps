"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
function containerBehavior(structure) {
    if (!isTarget(structure)) {
        return console.log(`${structure.id} is not container(${structure.structureType})`);
    }
    const clothestSpawn = structure.pos.findClosestByRange(Object.values(Game.spawns));
    if (clothestSpawn) {
        const innerClothestStorage = structure.pos.findClosestByRange(clothestSpawn.pos.findInRange(FIND_STRUCTURES, clothestSpawn.pos.getRangeTo(structure) - 1, {
            filter: (s) => [STRUCTURE_CONTAINER, STRUCTURE_STORAGE].some((t) => t === s.structureType),
        }));
        const requests = Math.min(2, Math.ceil(Math.max(1, (structure.store.energy - ((innerClothestStorage === null || innerClothestStorage === void 0 ? void 0 : innerClothestStorage.store.energy) || 0)) * 2) / CONTAINER_CAPACITY));
        new RoomVisual(structure.room.name).text(requests.toString(), structure.pos);
        return _.range(requests).map((n) => {
            const carrierName = `C_${structure.pos.x}_${structure.pos.y}_${n}`;
            if (!Game.creeps[carrierName]) {
                const spawn = structure.room
                    .find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_SPAWN,
                })
                    .find((spawn) => !spawn.spawning);
                if (spawn && spawn.room.energyAvailable > spawn.room.energyCapacityAvailable * 0.6) {
                    return spawn.spawnCreep((0, util_creep_1.filterBodiesByCost)("carrier", spawn.room.energyAvailable), carrierName, {
                        memory: {
                            role: "carrier",
                            storeId: structure.id,
                        },
                    });
                }
                else {
                    return ERR_NOT_FOUND;
                }
            }
            else {
                return OK;
            }
        });
    }
}
exports.default = containerBehavior;
function isTarget(s) {
    return [STRUCTURE_CONTAINER, STRUCTURE_STORAGE].includes(s.structureType);
}
