"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findMyStructures = void 0;
exports.getCapacityRate = getCapacityRate;
exports.getSpawnsInRoom = getSpawnsInRoom;
exports.getSitesInRoom = getSitesInRoom;
exports.getSpawnsOrderdByRange = getSpawnsOrderdByRange;
exports.getSpawnsWithDistance = getSpawnsWithDistance;
exports.isCompound = isCompound;
exports.getLabs = getLabs;
exports.getTerminals = getTerminals;
exports.logUsage = logUsage;
exports.isHighway = isHighway;
exports.calcMaxTransferAmount = calcMaxTransferAmount;
exports.readonly = readonly;
exports.getDecayAmount = getDecayAmount;
exports.getOrderRemainingTotal = getOrderRemainingTotal;
exports.getAvailableAmount = getAvailableAmount;
exports.getSurplusEnergy = getSurplusEnergy;
const constants_1 = require("./constants");
function getCapacityRate(s, type = RESOURCE_ENERGY) {
    if ("store" in s) {
        return s.store.getUsedCapacity(type) / s.store.getCapacity(type);
    }
    else {
        return Infinity;
    }
}
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
                switch (s.structureType) {
                    case STRUCTURE_CONTROLLER:
                        structures.controller = s;
                        break;
                    case STRUCTURE_POWER_SPAWN:
                        structures.powerSpawn = s;
                        break;
                    case STRUCTURE_STORAGE:
                        structures.storage = s;
                        break;
                    case STRUCTURE_OBSERVER:
                        structures.observer = s;
                        break;
                    case STRUCTURE_EXTRACTOR:
                        structures.extractor = s;
                        break;
                    case STRUCTURE_TERMINAL:
                        structures.terminal = s;
                        break;
                    case STRUCTURE_NUKER:
                        structures.nuker = s;
                        break;
                    case STRUCTURE_FACTORY:
                        structures.factory = s;
                        break;
                    default:
                        structures[s.structureType].push(s);
                        break;
                }
                return structures;
            }, {
                all: [],
                constructedWall: [],
                container: [],
                controller: room.controller,
                extension: [],
                extractor: undefined,
                factory: undefined,
                invaderCore: [],
                keeperLair: [],
                lab: [],
                link: [],
                nuker: undefined,
                observer: undefined,
                portal: [],
                powerBank: [],
                powerSpawn: undefined,
                rampart: [],
                road: [],
                spawn: [],
                storage: room.storage,
                terminal: room.terminal,
                tower: [],
                source: room.find(FIND_SOURCES),
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
function getSitesInRoom(r) {
    const room = _.isString(r) ? Game.rooms[r] : r;
    if (!room) {
        return [];
    }
    return Object.values(Game.constructionSites).filter((s) => s.pos.roomName === room.name);
}
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
function getSpawnsWithDistance(src) {
    const pos = "pos" in src ? src.pos : src;
    return _(Object.values(Game.spawns)).map((spawn) => {
        return {
            spawn,
            distance: Game.map.getRoomLinearDistance(pos.roomName, spawn.room.name),
        };
    });
}
function isCompound(resource) {
    return !!(resource.length >= 2 && /^[A-Z]/.exec(resource));
}
function getLabs(room) {
    const lab = (0, exports.findMyStructures)(room).lab;
    return _(lab).map((lab) => {
        return Object.assign(lab, {
            memory: room.memory.labs[lab.id],
        });
    });
}
function getTerminals() {
    return _(Object.values(Game.rooms))
        .map(({ terminal }) => {
        if (terminal) {
            return Object.assign(terminal, {
                memory: ((Memory.terminals = Memory.terminals || {})[terminal.id] = Memory.terminals[terminal.id] || {}),
            });
        }
        else {
            return undefined;
        }
    })
        .compact()
        .run();
}
let indent = -1;
function logUsage(title, func, threthold = 0) {
    if (indent > 10) {
        indent = -1;
    }
    indent++;
    const start = Game.cpu.getUsed();
    const value = func();
    const used = _.floor(Game.cpu.getUsed() - start, 2);
    used >= threthold && console.log(`${" ".repeat(indent * 2)}${used} ${title}`);
    indent = Math.max(indent - 1, 0);
    return value;
}
function isHighway(room) {
    const parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(room.name);
    return parsed && (Number(parsed[1]) % 10 === 0 || Number(parsed[2]) % 10 === 0);
}
function calcMaxTransferAmount(order, terminal) {
    if (!order.roomName) {
        return 0;
    }
    return Math.floor(terminal.store.energy / (1 - Math.exp(-Game.map.getRoomLinearDistance(terminal.room.name, order.roomName) / 30)));
}
function readonly(a) {
    return a;
}
function getDecayAmount(s) {
    switch (s.structureType) {
        case STRUCTURE_RAMPART:
            return RAMPART_DECAY_AMOUNT;
        case STRUCTURE_CONTAINER:
            return CONTAINER_DECAY;
        case STRUCTURE_ROAD:
            switch (s.room.getTerrain().get(s.pos.x, s.pos.y)) {
                case TERRAIN_MASK_SWAMP:
                    return constants_1.ROAD_DECAY_AMOUNT_SWAMP;
                case TERRAIN_MASK_WALL:
                    return constants_1.ROAD_DECAY_AMOUNT_WALL;
                default:
                    return ROAD_DECAY_AMOUNT;
            }
        default:
            return 0;
    }
}
function getOrderRemainingTotal(terminal, resourceType) {
    return _(Object.values(Game.market.orders))
        .filter((o) => o.type === ORDER_SELL && o.resourceType === resourceType && o.roomName === terminal.room.name)
        .sum((o) => o.remainingAmount);
}
function getAvailableAmount(terminal, resourceType) {
    return terminal.store[resourceType] - getOrderRemainingTotal(terminal, resourceType);
}
function getSurplusEnergy(room) {
    const { container, link } = (0, exports.findMyStructures)(room);
    return _([container, link])
        .flatten()
        .compact()
        .sum((s) => s.store.energy);
}
