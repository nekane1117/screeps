"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stealBy = exports.pickUpAll = exports.getSpawnNamesInRoom = exports.getCreepsInRoom = exports.customMove = exports.RETURN_CODE_DECODER = exports.getBodyCost = exports.MIN_BODY = exports.randomWalk = exports.DIRECTIONS = exports.bodyMaker = exports.squareDiff = exports.isStoreTarget = void 0;
function isStoreTarget(x) {
    return [STRUCTURE_CONTAINER, STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_STORAGE, STRUCTURE_LINK].some((t) => t === x.structureType);
}
exports.isStoreTarget = isStoreTarget;
exports.squareDiff = Object.freeze([
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
]);
function bodyMaker(role, cost) {
    const bodies = [...exports.MIN_BODY[role]];
    const diff = [...(DIFF_BODY[role] || exports.MIN_BODY[role])];
    const getTotalCost = () => _(bodies)
        .map((p) => BODYPART_COST[p])
        .sum();
    while (getTotalCost() <= cost && bodies.length <= 50) {
        bodies.push(diff[_.random(0, diff.length - 1)]);
    }
    return bodies.slice(0, bodies.length - 1);
}
exports.bodyMaker = bodyMaker;
exports.DIRECTIONS = {
    [TOP_LEFT]: "TOP_LEFT",
    [TOP]: "TOP",
    [TOP_RIGHT]: "TOP_RIGHT",
    [LEFT]: "LEFT",
    [RIGHT]: "RIGHT",
    [BOTTOM_LEFT]: "BOTTOM_LEFT",
    [BOTTOM]: "BOTTOM",
    [BOTTOM_RIGHT]: "BOTTOM_RIGHT",
};
function randomWalk(creep) {
    const directions = _(exports.DIRECTIONS)
        .keys()
        .map((d) => Number(d))
        .run();
    return creep.move(directions[_.random(0, directions.length - 1)]);
}
exports.randomWalk = randomWalk;
exports.MIN_BODY = Object.freeze({
    builder: [WORK, CARRY, MOVE],
    carrier: [CARRY, MOVE],
    defender: [],
    harvester: [WORK, CARRY, MOVE],
    repairer: [WORK, CARRY, MOVE],
    upgrader: [WORK, CARRY, MOVE],
});
const DIFF_BODY = Object.freeze({
    harvester: [WORK, WORK, CARRY],
    upgrader: [WORK, CARRY, WORK, CARRY, MOVE],
});
const getBodyCost = (bodies) => _(bodies)
    .map((p) => BODYPART_COST[p])
    .sum();
exports.getBodyCost = getBodyCost;
exports.RETURN_CODE_DECODER = Object.freeze({
    [OK.toString()]: "OK",
    [ERR_NOT_OWNER.toString()]: "ERR_NOT_OWNER",
    [ERR_NO_PATH.toString()]: "ERR_NO_PATH",
    [ERR_NAME_EXISTS.toString()]: "ERR_NAME_EXISTS",
    [ERR_BUSY.toString()]: "ERR_BUSY",
    [ERR_NOT_FOUND.toString()]: "ERR_NOT_FOUND",
    [ERR_NOT_ENOUGH_RESOURCES.toString()]: "ERR_NOT_ENOUGH",
    [ERR_INVALID_TARGET.toString()]: "ERR_INVALID_TARGET",
    [ERR_FULL.toString()]: "ERR_FULL",
    [ERR_NOT_IN_RANGE.toString()]: "ERR_NOT_IN_RANGE",
    [ERR_INVALID_ARGS.toString()]: "ERR_INVALID_ARGS",
    [ERR_TIRED.toString()]: "ERR_TIRED",
    [ERR_NO_BODYPART.toString()]: "ERR_NO_BODYPART",
    [ERR_RCL_NOT_ENOUGH.toString()]: "ERR_RCL_NOT_ENOUGH",
    [ERR_GCL_NOT_ENOUGH.toString()]: "ERR_GCL_NOT_ENOUGH",
});
const DIRECTIONS_DIFF = {
    [TOP_LEFT]: [-1, -1],
    [TOP]: [-1, 0],
    [TOP_RIGHT]: [-1, 1],
    [LEFT]: [0, -1],
    [RIGHT]: [0, 1],
    [BOTTOM_LEFT]: [1, -1],
    [BOTTOM]: [1, 0],
    [BOTTOM_RIGHT]: [1, 1],
};
const customMove = (creep, target, opt) => {
    var _a, _b;
    if (creep.fatigue) {
        return OK;
    }
    const direction = ((_a = creep.memory._move) === null || _a === void 0 ? void 0 : _a.path[0].direction) && DIRECTIONS_DIFF[(_b = creep.memory._move) === null || _b === void 0 ? void 0 : _b.path[0].direction];
    const moved = creep.moveTo(target, Object.assign({ ignoreCreeps: !creep.pos.inRangeTo(target, getCreepsInRoom(creep.room).length) && Game.time % 5 !== 0, serializeMemory: false }, opt));
    if (moved === ERR_NO_PATH && direction) {
        creep.room.lookForAt(LOOK_CREEPS, creep.pos.x + direction[0], creep.pos.y + direction[1]).map((neighbor) => {
            creep.pull(neighbor);
            neighbor.moveTo(creep);
        });
    }
    return moved;
};
exports.customMove = customMove;
function getCreepsInRoom(room) {
    var _a;
    if (((_a = room.memory.creeps) === null || _a === void 0 ? void 0 : _a.tick) === Game.time) {
        return room.memory.creeps.names;
    }
    else {
        room.memory.creeps = {
            tick: Game.time,
            names: Object.entries(Game.creeps)
                .filter(([_, creep]) => creep.room.name === room.name)
                .map((entry) => entry[0]),
        };
        return room.memory.creeps.names;
    }
}
exports.getCreepsInRoom = getCreepsInRoom;
function getSpawnNamesInRoom(room) {
    var _a;
    if (((_a = room.memory.spawns) === null || _a === void 0 ? void 0 : _a.tick) === Game.time) {
        return room.memory.spawns.names;
    }
    else {
        room.memory.spawns = {
            tick: Game.time,
            names: Object.entries(Game.spawns)
                .filter(([_, spawns]) => spawns.room.name === room.name)
                .map((entry) => entry[0]),
        };
        return room.memory.spawns.names;
    }
}
exports.getSpawnNamesInRoom = getSpawnNamesInRoom;
function pickUpAll(creep) {
    creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1).forEach((resource) => {
        creep.pickup(resource);
    });
    [...creep.pos.findInRange(FIND_TOMBSTONES, 1), ...creep.pos.findInRange(FIND_RUINS, 1)].forEach((tombstone) => {
        creep.withdraw(tombstone, RESOURCE_ENERGY);
    });
}
exports.pickUpAll = pickUpAll;
function stealBy(creep, roles, type = RESOURCE_ENERGY) {
    return creep.pos
        .findInRange(FIND_MY_CREEPS, 1, {
        filter: (c) => roles.includes(c.memory.role),
    })
        .map((t) => t.transfer(creep, type));
}
exports.stealBy = stealBy;
