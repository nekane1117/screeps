"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultTo = exports.getSpawnsInRoom = exports.getCreepNamesInRoom = exports.cond = exports.noop = exports.stubTrue = exports.someOf = exports.shallowEq = exports.getBodyByCost = exports.ObjectKeys = void 0;
function ObjectKeys(o) {
    return Object.keys(o);
}
exports.ObjectKeys = ObjectKeys;
function getBodyByCost(bodies, cost) {
    return bodies
        .map((parts) => {
        return {
            parts,
            cost: BODYPART_COST[parts],
        };
    })
        .map(({ parts }, i, arr) => {
        return {
            parts,
            totalCost: _(arr)
                .slice(0, i + 1)
                .map((p) => p.cost)
                .sum(),
        };
    })
        .filter((p) => {
        return p.totalCost <= cost;
    })
        .map((p) => p.parts);
}
exports.getBodyByCost = getBodyByCost;
function shallowEq(value1) {
    return (value2) => {
        return value1 === value2;
    };
}
exports.shallowEq = shallowEq;
function someOf(...arr) {
    return (value) => arr.some((v) => v === value);
}
exports.someOf = someOf;
function stubTrue() {
    return (_v2) => {
        return true;
    };
}
exports.stubTrue = stubTrue;
function noop(_) {
}
exports.noop = noop;
function cond(...conditions) {
    if (conditions.length === 0) {
        throw new Error("no conditions");
    }
    return (value) => {
        return (conditions.find((c) => c[0](value)) || conditions[conditions.length - 1])[1](value);
    };
}
exports.cond = cond;
function getCreepNamesInRoom(room) {
    var _a;
    if (Game.time === ((_a = room.memory.creeps) === null || _a === void 0 ? void 0 : _a.tick)) {
        return room.memory.creeps.value;
    }
    else {
        return (room.memory.creeps = {
            tick: Game.time,
            value: Object.values(Game.creeps)
                .filter((c) => c.room.name === room.name)
                .reduce((creeps, c) => {
                return Object.assign(Object.assign({}, creeps), { [c.memory.role]: (creeps[c.memory.role] || []).concat(c.name) });
            }, {}),
        }).value;
    }
}
exports.getCreepNamesInRoom = getCreepNamesInRoom;
function getSpawnsInRoom(room) {
    var _a;
    if (Game.time === ((_a = room.memory.spawns) === null || _a === void 0 ? void 0 : _a.tick)) {
        return _(room.memory.spawns.value.map((name) => Game.spawns[name]))
            .compact()
            .run();
    }
    else {
        return _((room.memory.spawns = {
            tick: Game.time,
            value: Object.values(Game.spawns)
                .filter((c) => c.room.name === room.name)
                .map((spawn) => spawn.name),
        }).value)
            .map((name) => Game.spawns[name])
            .compact()
            .run();
    }
}
exports.getSpawnsInRoom = getSpawnsInRoom;
function defaultTo(value, defaultValue) {
    if (value === undefined || value === null) {
        return defaultValue;
    }
    else {
        return value;
    }
}
exports.defaultTo = defaultTo;
