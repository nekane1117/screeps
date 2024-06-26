"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REVERSE_BOOSTS = exports.getRepairPower = exports.getCarrierBody = exports.moveRoom = exports.toColor = exports.withdrawBy = exports.pickUpAll = exports.getMainSpawn = exports.getCreepsInRoom = exports.customMove = exports.RETURN_CODE_DECODER = exports.IDEAL_BODY = exports.randomWalk = exports.DIRECTIONS = exports.filterBodiesByCost = exports.squareDiff = exports.isStoreTarget = void 0;
const util_array_1 = require("./util.array");
const utils_1 = require("./utils");
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
    var _a;
    const bodies = exports.IDEAL_BODY[role]
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
    });
    return {
        bodies: (0, util_array_1.complexOrder)(bodies.map((c) => c.parts), [
            (p) => {
                return [TOUGH, HEAL, RANGED_ATTACK, ATTACK, CLAIM, MOVE, CARRY, WORK].indexOf(p);
            },
        ]).run(),
        cost: ((_a = _.last(bodies)) === null || _a === void 0 ? void 0 : _a.total) || 0,
    };
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
    builder: _.range(50).map((i) => {
        const b = [WORK, CARRY, MOVE];
        return b[i % b.length];
    }),
    claimer: [CLAIM, MOVE],
    reserver: [CLAIM, MOVE, CLAIM, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, HEAL, MOVE],
    remoteHarvester: _.range(50).map((i) => {
        const b = [
            WORK,
            MOVE,
            CARRY,
            MOVE,
            RANGED_ATTACK,
            MOVE,
            ATTACK,
            MOVE,
            WORK,
            MOVE,
            WORK,
            MOVE,
            WORK,
            MOVE,
            WORK,
            MOVE,
            ..._.range(50).map((i) => {
                const b = [MOVE, CARRY];
                return b[i % b.length];
            }),
        ].slice(0, 25);
        return b[i % b.length];
    }),
    carrier: [],
    labManager: [MOVE, CARRY, CARRY],
    defender: _.range(50).map((i) => {
        const b = [MOVE, RANGED_ATTACK, RANGED_ATTACK, MOVE, HEAL, HEAL, MOVE, TOUGH, ATTACK];
        return b[i % b.length];
    }),
    mineralCarrier: [
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
        MOVE,
        MOVE,
    ],
    mineralHarvester: [
        WORK,
        MOVE,
        CARRY,
        CARRY,
        ..._(_.range(23).map(() => {
            return [WORK, MOVE];
        }))
            .flatten()
            .run(),
    ],
    upgrader: [WORK, MOVE, CARRY, WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, WORK, MOVE],
    remoteCarrier: [],
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
    creep.memory.moved = creep.moveTo(target, Object.assign(Object.assign({ plainCost: 2, swampCost: 10, serializeMemory: false, ignoreCreeps: !creep.pos.inRangeTo(target, DEFAULT_CREEP_RANGE[creep.memory.role] + 2) }, opt), { visualizePathStyle: Object.assign({ opacity: 0.55, stroke: toColor(creep) }, opt === null || opt === void 0 ? void 0 : opt.visualizePathStyle) }));
    if (creep.memory.moved === OK && Game.time % 3) {
        const { dy, dx } = ((_b = (_a = creep.memory._move) === null || _a === void 0 ? void 0 : _a.path) === null || _b === void 0 ? void 0 : _b[0]) || {};
        const isInRange = (n) => {
            return 0 < n && n < 49;
        };
        if (dx !== undefined && dy !== undefined && isInRange(creep.pos.x + dx) && isInRange(creep.pos.y + dy)) {
            const blocker = (_c = creep.room.lookForAt(LOOK_CREEPS, creep.pos.x + dx, creep.pos.y + dy)) === null || _c === void 0 ? void 0 : _c[0];
            if (blocker && blocker.memory.moved !== OK) {
                const pull = creep.pull(blocker);
                const move = blocker.move(creep);
                creep.memory._move = undefined;
                blocker.memory._move = undefined;
                (pull || move) &&
                    console.log(JSON.stringify({ name: creep.name, pull: exports.RETURN_CODE_DECODER[pull.toString()], move: exports.RETURN_CODE_DECODER[move.toString()] }));
            }
        }
    }
    return creep.memory.moved;
};
exports.customMove = customMove;
function getCreepsInRoom(room) {
    if (room.memory.creeps) {
        return room.memory.creeps;
    }
    else {
        return (room.memory.creeps = Object.values(Game.creeps)
            .filter((c) => c.memory.baseRoom === room.name)
            .reduce((creeps, c) => {
            if (!creeps[c.memory.role]) {
                creeps[c.memory.role] = [];
            }
            creeps[c.memory.role].push(c);
            return creeps;
        }, {}));
    }
}
exports.getCreepsInRoom = getCreepsInRoom;
function getMainSpawn(room) {
    const spawn = room.memory.mainSpawn && Game.getObjectById(room.memory.mainSpawn);
    if (spawn) {
        return spawn;
    }
    else {
        const spawn = _(Object.values(Game.spawns).filter((s) => s.room.name === room.name)).first();
        room.memory.mainSpawn = spawn === null || spawn === void 0 ? void 0 : spawn.id;
        return spawn;
    }
}
exports.getMainSpawn = getMainSpawn;
function pickUpAll(creep, resourceType = RESOURCE_ENERGY) {
    creep.pos
        .findInRange(FIND_DROPPED_RESOURCES, 1, {
        filter: (s) => s.resourceType === resourceType,
    })
        .forEach((resource) => {
        creep.pickup(resource);
    });
    [...creep.pos.findInRange(FIND_TOMBSTONES, 1), ...creep.pos.findInRange(FIND_RUINS, 1)].forEach((tombstone) => {
        creep.withdraw(tombstone, resourceType);
    });
}
exports.pickUpAll = pickUpAll;
function withdrawBy(creep, roles, type = RESOURCE_ENERGY) {
    return creep.pos
        .findInRange(FIND_MY_CREEPS, 1, {
        filter: (c) => roles.includes(c.memory.role),
    })
        .map((t) => t.transfer(creep, type));
}
exports.withdrawBy = withdrawBy;
function toColor({ id }) {
    return `#${id.slice(-6)}`;
}
exports.toColor = toColor;
function moveRoom(creep, fromRoom, toRoom) {
    var _a, _b, _c, _d;
    const memory = (0, utils_1.readonly)(creep.memory);
    creep.memory.__moveRoom = memory.__moveRoom || {};
    const route = ((_a = memory.__moveRoom) === null || _a === void 0 ? void 0 : _a.route) ||
        (creep.memory.__moveRoom.route = Game.map.findRoute(fromRoom, toRoom, {
            routeCallback(roomName) {
                var _a, _b;
                const parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
                const isHighway = parsed && (Number(parsed[1]) % 10 === 0 || Number(parsed[2]) % 10 === 0);
                if (isHighway || ((_b = (_a = Game.rooms[roomName]) === null || _a === void 0 ? void 0 : _a.controller) === null || _b === void 0 ? void 0 : _b.my)) {
                    return 1;
                }
                else {
                    return 2.5;
                }
            },
        }));
    if (!Array.isArray(route)) {
        creep.memory.__moveRoom.route = undefined;
        return route;
    }
    const current = route[route.findIndex((r) => r.room === creep.pos.roomName) + 1];
    if (!current) {
        creep.memory.__moveRoom.route = undefined;
        return;
    }
    if (((_c = (_b = memory.__moveRoom) === null || _b === void 0 ? void 0 : _b.exit) === null || _c === void 0 ? void 0 : _c.roomName) !== creep.pos.roomName) {
        creep.memory.__moveRoom.exit = creep.pos.findClosestByPath(current.exit);
    }
    const moved = ((_d = memory.__moveRoom) === null || _d === void 0 ? void 0 : _d.exit) && (0, exports.customMove)(creep, new RoomPosition(memory.__moveRoom.exit.x, memory.__moveRoom.exit.y, memory.__moveRoom.exit.roomName));
    if (moved !== OK) {
        const code = moved ? exports.RETURN_CODE_DECODER[moved.toString()] : "no exit";
        console.log(`${creep.name}:${code}`);
        creep.say(code.replace("ERR_", ""));
        creep.memory.__moveRoom.route = undefined;
        creep.memory.__moveRoom.exit = undefined;
    }
    return moved;
}
exports.moveRoom = moveRoom;
function getCarrierBody(room, role) {
    var _a;
    const safetyFactor = 2;
    const bodyCycle = [CARRY, MOVE, CARRY];
    let costTotal = 0;
    const avgSize = ((_a = room.memory.carrySize) === null || _a === void 0 ? void 0 : _a[role]) || 100;
    return _.range(Math.ceil(avgSize / 50) * safetyFactor * 1.5)
        .slice(0, 50)
        .map((i) => {
        const parts = i === 0 ? WORK : bodyCycle[i % bodyCycle.length];
        costTotal += BODYPART_COST[parts];
        return { parts, costTotal };
    })
        .filter((p) => p.costTotal <= room.energyAvailable)
        .map((p) => p.parts);
}
exports.getCarrierBody = getCarrierBody;
const DEFAULT_CREEP_RANGE = {
    builder: 3,
    carrier: 1,
    claimer: 1,
    defender: 3,
    harvester: 1,
    labManager: 1,
    mineralCarrier: 1,
    mineralHarvester: 1,
    remoteHarvester: 1,
    remoteCarrier: 1,
    reserver: 1,
    upgrader: 1,
};
function getRepairPower(creep) {
    return _(creep.body)
        .filter((b) => b.type === WORK)
        .map((b) => {
        return REPAIR_POWER * ((b.boost && exports.REVERSE_BOOSTS.repair[b.boost]) || 1);
    })
        .sum();
}
exports.getRepairPower = getRepairPower;
exports.REVERSE_BOOSTS = {
    repair: {
        [RESOURCE_LEMERGIUM_ACID]: BOOSTS.work[RESOURCE_LEMERGIUM_ACID].repair,
        [RESOURCE_LEMERGIUM_HYDRIDE]: BOOSTS.work[RESOURCE_LEMERGIUM_HYDRIDE].repair,
        [RESOURCE_CATALYZED_LEMERGIUM_ACID]: BOOSTS.work[RESOURCE_CATALYZED_LEMERGIUM_ACID].repair,
    },
    build: {
        [RESOURCE_LEMERGIUM_ACID]: BOOSTS.work[RESOURCE_LEMERGIUM_ACID].repair,
        [RESOURCE_LEMERGIUM_HYDRIDE]: BOOSTS.work[RESOURCE_LEMERGIUM_HYDRIDE].repair,
        [RESOURCE_CATALYZED_LEMERGIUM_ACID]: BOOSTS.work[RESOURCE_CATALYZED_LEMERGIUM_ACID].repair,
    },
};
