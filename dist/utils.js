"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readonly = exports.calcMaxTransferAmount = exports.isHighway = exports.logUsage = exports.getSpawnsWithDistance = exports.getSpawnsOrderdByRange = exports.getSitesInRoom = exports.getSpawnsInRoom = exports.findMyStructures = exports.getCapacityRate = void 0;
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
                structures.all.push(s);
                structures[s.structureType].push(s);
                return structures;
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
function getSpawnsInRoom(r) {
    const room = _.isString(r) ? Game.rooms[r] : r;
    if (!room) {
        return [];
    }
    return Object.values(Game.spawns).filter((s) => s.pos.roomName === room.name);
}
exports.getSpawnsInRoom = getSpawnsInRoom;
function getSitesInRoom(r) {
    const room = _.isString(r) ? Game.rooms[r] : r;
    if (!room) {
        return [];
    }
    return Object.values(Game.constructionSites).filter((s) => s.pos.roomName === room.name);
}
exports.getSitesInRoom = getSitesInRoom;
function getSpawnsOrderdByRange(src, maxRooms) {
    const pos = "pos" in src ? src.pos : src;
    return _(Object.values(Game.spawns))
        .map((spawn) => {
        return {
            spawn,
            distance: Game.map.getRoomLinearDistance(pos.roomName, spawn.room.name),
        };
    })
        .filter((s) => s.spawn.room.name === "sim" || s.distance <= (maxRooms || Infinity))
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
function getSpawnsWithDistance(src) {
    const pos = "pos" in src ? src.pos : src;
    return _(Object.values(Game.spawns)).map((spawn) => {
        return {
            spawn,
            distance: Game.map.getRoomLinearDistance(pos.roomName, spawn.room.name),
        };
    });
}
exports.getSpawnsWithDistance = getSpawnsWithDistance;
let indent = -1;
function logUsage(title, func) {
    if (indent > 10) {
        indent = -1;
    }
    indent++;
    const start = Game.cpu.getUsed();
    const value = func();
    console.log(`${" ".repeat(indent * 2)}${_.floor(Game.cpu.getUsed() - start, 2)} ${title}`);
    indent--;
    return value;
}
exports.logUsage = logUsage;
function isHighway(room) {
    const parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(room.name);
    return parsed && (Number(parsed[1]) % 10 === 0 || Number(parsed[2]) % 10 === 0);
}
exports.isHighway = isHighway;
function calcMaxTransferAmount(order, terminal) {
    if (!order.roomName) {
        return 0;
    }
    return Math.floor(terminal.store.energy / (1 - Math.exp(-Game.map.getRoomLinearDistance(terminal.room.name, order.roomName) / 30)));
}
exports.calcMaxTransferAmount = calcMaxTransferAmount;
function readonly(a) {
    return a;
}
exports.readonly = readonly;
