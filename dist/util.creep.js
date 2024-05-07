"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stealBy = exports.pickUpAll = exports.getSpawnNamesInRoom = exports.getCreepsInRoom = exports.customMove = exports.RETURN_CODE_DECODER = exports.IDEAL_BODY = exports.randomWalk = exports.DIRECTIONS = exports.filterBodiesByCost = exports.squareDiff = exports.isStoreTarget = void 0;
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
function filterBodiesByCost(role, cost) {
    return exports.IDEAL_BODY[role]
        .reduce((bodies, parts) => {
        var _a;
        const total = ((_a = _.last(bodies)) === null || _a === void 0 ? void 0 : _a.total) || 0;
        return bodies.concat({
            parts,
            total: total + BODYPART_COST[parts],
        });
    }, [])
        .filter(({ total }) => {
        return total <= cost;
    })
        .map((c) => c.parts);
}
exports.filterBodiesByCost = filterBodiesByCost;
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
exports.IDEAL_BODY = Object.freeze({
    builder: [
        WORK,
        CARRY,
        MOVE,
        CARRY,
        ..._(_.range(23).map(() => {
            return [MOVE, CARRY];
        }))
            .flatten()
            .run(),
    ],
    carrier: [
        ..._(_.range(25).map(() => {
            return [MOVE, CARRY];
        }))
            .flatten()
            .run(),
    ],
    harvester: [
        WORK,
        MOVE,
        CARRY,
        WORK,
        WORK,
        WORK,
        WORK,
    ],
    repairer: [
        WORK,
        CARRY,
        MOVE,
        CARRY,
        ..._(_.range(23).map(() => {
            return [MOVE, CARRY];
        }))
            .flatten()
            .run(),
    ],
    upgrader: [CARRY, MOVE, ..._.range(5).map(() => WORK)],
});
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
const customMove = (creep, target, opt) => {
    var _a, _b, _c;
    if (creep.fatigue) {
        return OK;
    }
    creep.memory.moved = creep.moveTo(target, Object.assign({ plainCost: 2, ignoreCreeps: !creep.pos.inRangeTo(target, 4), serializeMemory: false }, opt));
    if (creep.memory.moved === OK) {
        const { dy, dx } = ((_b = (_a = creep.memory._move) === null || _a === void 0 ? void 0 : _a.path) === null || _b === void 0 ? void 0 : _b[0]) || {};
        if (dx !== undefined && dy !== undefined) {
            const blocker = (_c = creep.room.lookForAt(LOOK_CREEPS, creep.pos.x + dx, creep.pos.y + dy)) === null || _c === void 0 ? void 0 : _c[0];
            if (blocker && blocker.memory.moved === undefined) {
                const pull = creep.pull(blocker);
                const move = blocker.move(creep);
                (pull || move) &&
                    console.log(JSON.stringify({ name: creep.name, pull: exports.RETURN_CODE_DECODER[pull.toString()], move: exports.RETURN_CODE_DECODER[move.toString()] }));
            }
        }
    }
    return creep.memory.moved;
};
exports.customMove = customMove;
function getCreepsInRoom(room) {
    return (() => {
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
    })()
        .map((name) => Game.creeps[name])
        .filter((c) => c);
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
