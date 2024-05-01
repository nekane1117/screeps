"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const utils_1 = require("./utils");
function containerBehavior(structure) {
    if (!isTarget(structure)) {
        return console.log(`${structure.id} is not container(${structure.structureType})`);
    }
    return _.range(2).map((n) => {
        const carrierName = `C_${structure.pos.x}_${structure.pos.y}_${n}`;
        if (!Game.creeps[carrierName]) {
            const spawn = structure.room
                .find(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_SPAWN,
            })
                .find((spawn) => !spawn.spawning);
            if (spawn && spawn.room.energyAvailable > spawn.room.energyCapacityAvailable * 0.5) {
                return spawn.spawnCreep((0, utils_1.getBodyByCost)(constants_1.BODY.carrier, spawn.room.energyAvailable), carrierName, {
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
exports.default = containerBehavior;
function isTarget(s) {
    return s.structureType === STRUCTURE_CONTAINER;
}
