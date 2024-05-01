"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HARVESTER_BODY = exports.DIRECTIONS = exports.RETURN_CODE_DECODER = exports.getNeighborhoods = exports.neighborhoods = void 0;
exports.neighborhoods = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
];
const getNeighborhoods = (pos) => {
    const p = "pos" in pos ? pos.pos : pos;
    return _(exports.neighborhoods)
        .map(([dx, dy]) => {
        var _a;
        return (_a = Game.rooms[p.roomName]) === null || _a === void 0 ? void 0 : _a.getPositionAt(p.x + dx, p.y + dy);
    })
        .compact();
};
exports.getNeighborhoods = getNeighborhoods;
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
exports.DIRECTIONS = {
    [TOP_LEFT]: [-1, -1],
    [TOP]: [0, -1],
    [TOP_RIGHT]: [1, -1],
    [LEFT]: [-1, 0],
    [RIGHT]: [1, 0],
    [BOTTOM_LEFT]: [-1, 1],
    [BOTTOM]: [0, 1],
    [BOTTOM_RIGHT]: [1, 1],
};
exports.HARVESTER_BODY = Object.freeze([
    WORK,
    MOVE,
    CARRY,
    WORK,
    WORK,
    WORK,
    WORK,
    ..._.range(43).map(() => CARRY),
]);
