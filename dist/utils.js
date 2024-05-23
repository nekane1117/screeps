"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logUsage = exports.getSpawnsOrderdByRange = exports.findMyStructures = exports.getCapacityRate = void 0;
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
    var _a, _b;
    if (!room.memory.find) {
        room.memory.find = {};
    }
    if (((_b = (_a = room.memory.find) === null || _a === void 0 ? void 0 : _a[FIND_STRUCTURES]) === null || _b === void 0 ? void 0 : _b.time) === Game.time) {
        return room.memory.find[FIND_STRUCTURES].data;
    }
    else {
        return (room.memory.find[FIND_STRUCTURES] = {
            time: Game.time,
            data: room.find(FIND_STRUCTURES).reduce((structures, s) => {
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
            }),
        }).data;
    }
};
exports.findMyStructures = findMyStructures;
function getSpawnsOrderdByRange(src, maxRooms) {
    const pos = "pos" in src ? src.pos : src;
    return _(Object.values(Game.spawns))
        .map((spawn) => {
        return {
            spawn,
            distance: Game.map.getRoomLinearDistance(pos.roomName, spawn.room.name),
        };
    })
        .filter((s) => s.distance <= (maxRooms || Infinity))
        .sort(({ spawn: s1, distance: d1 }, { spawn: s2, distance: d2 }) => {
        const df = d1 - d2;
        if (df !== 0) {
            return df;
        }
        return pos.getRangeTo(s1) - pos.getRangeTo(s2);
    })
        .map((p) => p.spawn);
}
exports.getSpawnsOrderdByRange = getSpawnsOrderdByRange;
let indent = -1;
function logUsage(title, func) {
    indent++;
    const start = Game.cpu.getUsed();
    const value = func();
    console.log(`${" ".repeat(indent * 2)}${_.floor(Game.cpu.getUsed() - start, 2)} ${title}`);
    indent--;
    return value;
}
exports.logUsage = logUsage;
