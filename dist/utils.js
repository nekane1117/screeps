"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cond = exports.noop = exports.stubTrue = exports.someOf = exports.shallowEq = exports.getBodyByCost = exports.ObjectKeys = void 0;
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
