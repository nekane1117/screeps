"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickUpAll = exports.commonHarvest = exports.getSpawnNamesInRoom = exports.getCreepsInRoom = exports.customMove = exports.RETURN_CODE_DECODER = exports.getBodyCost = exports.MIN_BODY = exports.randomWalk = exports.bodyMaker = exports.squareDiff = exports.isStoreTarget = void 0;
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
    const directions = [TOP_LEFT, TOP, TOP_RIGHT, LEFT, RIGHT, BOTTOM_LEFT, BOTTOM, BOTTOM_RIGHT];
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
const customMove = (creep, target, opt) => {
    if (creep.fatigue) {
        return OK;
    }
    return creep.moveTo(target, Object.assign({ ignoreCreeps: !creep.pos.inRangeTo(target, getCreepsInRoom(creep.room).length), serializeMemory: false }, opt));
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
function commonHarvest(creep) {
    var _a;
    // 対象設定処理
    if (!(creep.memory.harvestTargetId ||
        (creep.memory.harvestTargetId = (_a = creep.pos.findClosestByPath(_(creep.room.memory.activeSource)
            .map((id) => Game.getObjectById(id))
            .compact()
            .value(), {
            ignoreCreeps: true,
        })) === null || _a === void 0 ? void 0 : _a.id))) {
        // 完全に見つからなければうろうろしておく
        randomWalk(creep);
    }
    else {
        // 対象が見つかった時
        const source = Game.getObjectById(creep.memory.harvestTargetId);
        if (source) {
            creep.memory.harvested = {
                tick: Game.time,
                result: creep.harvest(source),
            };
            switch (creep.memory.harvested.result) {
                case ERR_NOT_IN_RANGE:
                    if (creep.memory.mode === "harvesting") {
                        // 収集モードで近くにいないときは近寄る
                        const moved = (0, exports.customMove)(creep, source);
                        switch (moved) {
                            case OK:
                                break;
                            case ERR_NO_PATH:
                                creep.memory.harvestTargetId = undefined;
                                break;
                            default:
                                creep.say(exports.RETURN_CODE_DECODER[moved.toString()]);
                                break;
                        }
                    }
                    break;
                // 資源がダメ系
                case ERR_NOT_ENOUGH_RESOURCES: // 空っぽ
                case ERR_INVALID_TARGET: // 対象が変
                    creep.memory.harvestTargetId = undefined;
                    break;
                // 来ないはずのやつ
                case ERR_NOT_OWNER: // 自creepじゃない
                case ERR_NOT_FOUND: // mineralは対象外
                case ERR_NO_BODYPART: // WORKが無い
                    console.log(`${creep.name} harvest returns ${exports.RETURN_CODE_DECODER[creep.memory.harvested.result.toString()]}`);
                    creep.say(exports.RETURN_CODE_DECODER[creep.memory.harvested.result.toString()]);
                    break;
                // 大丈夫なやつ
                case OK: // OK
                case ERR_TIRED: // 疲れた
                case ERR_BUSY: // spawning
                default:
                    break;
            }
        }
        else {
            // 指定されていたソースが見つからないとき
            // 対象をクリアしてうろうろしておく
            creep.memory.harvestTargetId = undefined;
            creep.memory.harvested = undefined;
            randomWalk(creep);
        }
    }
}
exports.commonHarvest = commonHarvest;
function pickUpAll(creep) {
    //withdraw
    // 通りがかりに落っこちてるリソースを拾う
    creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1).forEach((resource) => {
        creep.pickup(resource);
    });
    // 通りがかりの墓から拾う
    creep.pos.findInRange(FIND_TOMBSTONES, 1).forEach((tombstone) => {
        creep.withdraw(tombstone, RESOURCE_ENERGY);
    });
}
exports.pickUpAll = pickUpAll;
