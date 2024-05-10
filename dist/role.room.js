"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomBehavior = void 0;
const source_1 = require("./source");
const util_creep_1 = require("./util.creep");
function roomBehavior(room) {
    var _a, _b;
    if (room.find(FIND_HOSTILE_CREEPS).length && !((_a = room.controller) === null || _a === void 0 ? void 0 : _a.safeMode) && room.energyAvailable > SAFE_MODE_COST) {
        (_b = room.controller) === null || _b === void 0 ? void 0 : _b.activateSafeMode();
    }
    initMemory(room);
    room.find(FIND_SOURCES).map((source) => (0, source_1.behavior)(source));
    if (!room.memory.roadLayed || Math.abs(Game.time - room.memory.roadLayed) > 5000) {
        console.log("roadLayer in " + Game.time);
        roadLayer(room);
    }
    creteStructures(room);
    const gatherers = (0, util_creep_1.getCreepsInRoom)(room).filter((c) => c.memory.role === "gatherer");
    _.range(4).map((n) => {
        var _a;
        const name = `G_${n}`;
        if (gatherers.some((g) => g.name === name)) {
            return;
        }
        const spawn = (0, util_creep_1.getSpawnsInRoom)(room).find((r) => !r.spawning);
        if (spawn && room.energyAvailable > 200) {
            const { bodies, cost } = (0, util_creep_1.filterBodiesByCost)("gatherer", room.energyAvailable);
            if (spawn.spawnCreep(bodies, name, {
                memory: {
                    mode: "🛒",
                    role: "gatherer",
                },
            }) === OK) {
                (_a = room.memory.energySummary) === null || _a === void 0 ? void 0 : _a.push({
                    consumes: cost,
                    production: 0,
                });
            }
            return OK;
        }
    });
}
exports.roomBehavior = roomBehavior;
function creteStructures(room) {
    var _a;
    const { visual } = room;
    const spawn = Object.values(Game.spawns).find((s) => s.room.name === room.name);
    if (!spawn) {
        return;
    }
    const siteInRooms = Object.values(Game.constructionSites)
        .filter((s) => { var _a; return ((_a = s.room) === null || _a === void 0 ? void 0 : _a.name) === room.name; })
        .reduce((sites, s) => {
        sites.all.push(s);
        (sites[s.structureType] = sites[s.structureType] || []).push(s);
        return sites;
    }, { all: [] });
    if (room.controller) {
        if (CONTROLLER_STRUCTURES[STRUCTURE_LINK][room.controller.level] > 0 &&
            spawn.pos.findInRange(FIND_STRUCTURES, 1, { filter: (s) => s.structureType === STRUCTURE_LINK }).length === 0 &&
            (((_a = siteInRooms.link) === null || _a === void 0 ? void 0 : _a.length) || 0) === 0) {
            for (const [dx, dy] of fourNeighbors) {
                const pos = room.getPositionAt(spawn.pos.x + dx, spawn.pos.y + dy);
                if (!pos) {
                    break;
                }
                pos.lookFor(LOOK_STRUCTURES).map((s) => s.destroy());
                return pos.createConstructionSite(STRUCTURE_LINK);
            }
        }
        const targets = [STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_SPAWN, STRUCTURE_STORAGE];
        const terrain = room.getTerrain();
        for (const target of targets) {
            const extensions = [...siteInRooms.all, ...room.find(FIND_MY_STRUCTURES)].filter((s) => s.structureType === target);
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
    room.memory.energySummary = (room.memory.energySummary || [])
        .concat(room.getEventLog().reduce((summary, event) => {
        switch (event.event) {
            case EVENT_HARVEST:
                summary.production += event.data.amount;
                break;
            case EVENT_BUILD:
                summary.consumes += event.data.amount;
                break;
            case EVENT_REPAIR:
            case EVENT_UPGRADE_CONTROLLER:
                summary.consumes += event.data.energySpent;
                break;
            default:
                break;
        }
        return summary;
    }, {
        production: 0,
        consumes: 0,
    }))
        .slice(-CREEP_LIFE_TIME);
    const total = room.memory.energySummary.reduce((sum, current) => {
        sum.consumes += current.consumes || 0;
        sum.production += current.production || 0;
        return sum;
    }, {
        production: 0,
        consumes: 0,
    });
    const total100 = room.memory.energySummary.slice(-100).reduce((sum, current) => {
        sum.consumes += current.consumes || 0;
        sum.production += current.production || 0;
        return sum;
    }, {
        production: 0,
        consumes: 0,
    });
    visual.text(`生産量：${_.floor(total.production / room.memory.energySummary.length, 2)}(${_.floor(total100.production / 100, 2)})`, 25, 25, {
        align: "left",
    });
    visual.text(`消費量：${_.floor(total.consumes / room.memory.energySummary.length, 2)}(${_.floor(total100.consumes / 100, 2)})`, 25, 26, {
        align: "left",
    });
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
    _((0, util_creep_1.getSpawnsInRoom)(room))
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
                            costMatrix.set(x, y, 2);
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
const fourNeighbors = [
    [0, -1],
    [-1, 0],
    [1, 0],
    [0, 1],
];
function initMemory(room) {
    room.memory.find = {};
    room.memory.find[FIND_STRUCTURES] = undefined;
}
