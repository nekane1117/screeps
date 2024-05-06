"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomBehavior = void 0;
const util_creep_1 = require("./util.creep");
function roomBehavior(room) {
    var _a, _b;
    if (room.find(FIND_HOSTILE_CREEPS).length && !((_a = room.controller) === null || _a === void 0 ? void 0 : _a.safeMode) && room.energyAvailable > SAFE_MODE_COST) {
        (_b = room.controller) === null || _b === void 0 ? void 0 : _b.activateSafeMode();
    }
    if (!room.memory.roadLayed || Math.abs(Game.time - room.memory.roadLayed) > 5000) {
        console.log("roadLayer in " + Game.time);
        roadLayer(room);
    }
    creteStructures(room);
}
exports.roomBehavior = roomBehavior;
function creteStructures(room) {
    var _a;
    const spawn = (_a = Object.entries(Game.spawns).find(([_, s]) => s.room.name === room.name)) === null || _a === void 0 ? void 0 : _a[1];
    const targets = [STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_SPAWN, STRUCTURE_STORAGE];
    if (room.controller && spawn) {
        const terrain = room.getTerrain();
        for (const target of targets) {
            const extensions = [...room.find(FIND_MY_CONSTRUCTION_SITES), ...room.find(FIND_MY_STRUCTURES)].filter((s) => s.structureType === target);
            if (extensions.length < CONTROLLER_STRUCTURES[target][room.controller.level]) {
                for (const dist of _.range(1, 25)) {
                    for (const dy of _.range(-dist, dist + 1)) {
                        for (const dx of _.range(-dist, dist + 1)) {
                            if (Math.abs(dx) + Math.abs(dy) === dist &&
                                terrain.get(spawn.pos.x + dx, spawn.pos.y + dy) !== TERRAIN_MASK_WALL &&
                                room.createConstructionSite(spawn.pos.x + dx, spawn.pos.y + dy, generateCross(dx, dy) ? target : STRUCTURE_ROAD) === OK) {
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
}
const generateCross = (dx, dy) => {
    if (dx % 2 === 0) {
        return !((dy + (dx % 4 === 0 ? -2 : 0)) % 4 === 0);
    }
    else {
        return dy % 2 === 0;
    }
};
function roadLayer(room) {
    _((0, util_creep_1.getSpawnNamesInRoom)(room))
        .map((name) => Game.spawns[name])
        .compact()
        .forEach((spawn) => {
        const findCustomPath = (s) => spawn.pos.findPathTo(s, {
            ignoreCreeps: true,
            plainCost: 1,
            swampCost: 1,
            costCallback(roomName, costMatrix) {
                const room = Game.rooms[roomName];
                _.range(50).forEach((x) => {
                    _.range(50).forEach((y) => {
                        const pos = room.getPositionAt(x, y);
                        if (!pos) {
                            return;
                        }
                        else if (pos.look().some((s) => "structureType" in s && s.structureType === STRUCTURE_ROAD)) {
                            costMatrix.set(x, y, 1.5);
                        }
                    });
                });
            },
        });
        return (_([
            ...room.find(FIND_SOURCES),
            ...room.find(FIND_MY_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_CONTROLLER,
            }),
        ])
            .sortBy((s) => findCustomPath(s).length)
            .map((s) => {
            return findCustomPath(s).map((path) => {
                if (room.getTerrain().get(path.x, path.y) !== TERRAIN_MASK_WALL) {
                    room.createConstructionSite(path.x, path.y, STRUCTURE_ROAD);
                }
            });
        })
            .run());
    })
        .run();
    room.memory.roadLayed = Game.time;
    [
        ...Object.values(Game.constructionSites).filter((s) => {
            return OBSTACLE_OBJECT_TYPES.some((t) => t === s.structureType);
        }),
        ...room.find(FIND_STRUCTURES, {
            filter: (s) => {
                return OBSTACLE_OBJECT_TYPES.some((t) => t === s.structureType);
            },
        }),
    ].map((s) => {
        room
            .lookForAt(LOOK_STRUCTURES, s.pos)
            .filter((s) => s.structureType === STRUCTURE_ROAD)
            .map((r) => r.destroy());
    });
}
