"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBodyByCost = exports.ObjectKeys = void 0;
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
