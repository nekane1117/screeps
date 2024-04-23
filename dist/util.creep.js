"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonHarvest = exports.getSpawnNamesInRoom = exports.getCreepsInRoom = exports.customMove = exports.RETURN_CODE_DECODER = exports.getBodyCost = exports.MIN_BODY = exports.randomWalk = exports.bodyMaker = exports.squareDiff = exports.isStoreTarget = void 0;
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
const customMove = (creep, target) => {
    return creep.moveTo(target, {
        ignoreCreeps: !creep.pos.inRangeTo(target, getCreepsInRoom(creep.room).length),
    });
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
        room.memory.creeps = {
            tick: Game.time,
            names: Object.entries(Game.spawns)
                .filter(([_, spawns]) => spawns.room.name === room.name)
                .map((entry) => entry[0]),
        };
        return room.memory.creeps.names;
    }
}
exports.getSpawnNamesInRoom = getSpawnNamesInRoom;
function commonHarvest(creep) {
    var _a;
    // 対象が見つからない場合
    if (!(creep.memory.harvestTargetId ||
        (creep.memory.harvestTargetId = (_a = creep.pos.findClosestByPath(_(creep.room.memory.activeSource)
            .map((id) => Game.getObjectById(id))
            .compact()
            .value(), {
            ignoreCreeps: true,
        })) === null || _a === void 0 ? void 0 : _a.id))) {
        // うろうろしておく
        return randomWalk(creep);
    }
    const source = Game.getObjectById(creep.memory.harvestTargetId);
    if (!source) {
        // 指定されていたソースが見つからないとき
        // 対象をクリアしてうろうろしておく
        creep.memory.harvestTargetId = undefined;
        return randomWalk(creep);
    }
    const returnVal = creep.harvest(source);
    switch (returnVal) {
        case OK:
            return OK;
        // 離れていた時は向かう
        case ERR_NOT_IN_RANGE: {
            const returnVal = (0, exports.customMove)(creep, source);
            switch (returnVal) {
                // 問題のない者たち
                case OK:
                case ERR_BUSY:
                case ERR_TIRED:
                    return returnVal;
                default:
                    creep.say(exports.RETURN_CODE_DECODER[returnVal.toString()]);
                    creep.memory.harvestTargetId = undefined;
                    return returnVal;
            }
        }
        case ERR_NOT_ENOUGH_RESOURCES:
        case ERR_NOT_FOUND:
        case ERR_INVALID_TARGET:
            creep.memory.harvestTargetId = undefined;
            return returnVal;
        case ERR_NOT_OWNER:
        case ERR_BUSY:
        case ERR_TIRED:
        case ERR_NO_BODYPART:
        default:
            // 無視するやつは戻り値をそのまま返す
            creep.say(exports.RETURN_CODE_DECODER[returnVal.toString()]);
            return returnVal;
    }
}
exports.commonHarvest = commonHarvest;
