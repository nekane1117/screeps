"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RETURN_CODE_DECODER = exports.getBodyCost = exports.MIN_BODY = exports.randomWalk = exports.bodyMaker = exports.squareDiff = exports.isStoreTarget = void 0;
function isStoreTarget(x) {
    return [
        STRUCTURE_CONTAINER,
        STRUCTURE_SPAWN,
        STRUCTURE_EXTENSION,
        STRUCTURE_STORAGE,
        STRUCTURE_LINK,
    ].some((t) => t === x.structureType);
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
    // 入れ物
    const bodies = [...exports.MIN_BODY[role]];
    const getTotalCost = () => _(bodies)
        .map((p) => BODYPART_COST[p])
        .sum();
    let cnt = 0;
    // cost以下かつ50個以下の間くっつける
    while (getTotalCost() <= cost && bodies.length <= 50) {
        bodies.push(exports.MIN_BODY[role][cnt++ % exports.MIN_BODY[role].length]);
    }
    // 1個分超えてるはずなので最後の１個を消して返す
    return bodies.slice(0, bodies.length - 1);
}
exports.bodyMaker = bodyMaker;
function randomWalk(creep) {
    const directions = [
        TOP_LEFT,
        TOP,
        TOP_RIGHT,
        LEFT,
        RIGHT,
        BOTTOM_LEFT,
        BOTTOM,
        BOTTOM_RIGHT,
    ];
    return creep.move(directions[_.random(0, directions.length - 1)]);
}
exports.randomWalk = randomWalk;
exports.MIN_BODY = Object.freeze({
    builder: [WORK, CARRY, MOVE],
    carrier: [WORK, CARRY, MOVE],
    defender: [],
    harvester: [WORK, CARRY, MOVE],
    repairer: [WORK, CARRY, MOVE],
    upgrader: [WORK, CARRY, MOVE],
});
const getBodyCost = (bodies) => _(bodies)
    .map((p) => BODYPART_COST[p])
    .sum();
exports.getBodyCost = getBodyCost;
exports.RETURN_CODE_DECODER = Object.freeze({
    [OK]: "OK",
    [ERR_NOT_OWNER]: "ERR_NOT_OWNER",
    [ERR_NO_PATH]: "ERR_NO_PATH",
    [ERR_NAME_EXISTS]: "ERR_NAME_EXISTS",
    [ERR_BUSY]: "ERR_BUSY",
    [ERR_NOT_FOUND]: "ERR_NOT_FOUND",
    [ERR_NOT_ENOUGH_RESOURCES]: "ERR_NOT_ENOUGH",
    [ERR_INVALID_TARGET]: "ERR_INVALID_TARGET",
    [ERR_FULL]: "ERR_FULL",
    [ERR_NOT_IN_RANGE]: "ERR_NOT_IN_RANGE",
    [ERR_INVALID_ARGS]: "ERR_INVALID_ARGS",
    [ERR_TIRED]: "ERR_TIRED",
    [ERR_NO_BODYPART]: "ERR_NO_BODYPART",
    [ERR_RCL_NOT_ENOUGH]: "ERR_RCL_NOT_ENOUGH",
    [ERR_GCL_NOT_ENOUGH]: "ERR_GCL_NOT_ENOUGH",
});
