"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_common_1 = require("./utils.common");
const behavior = (creep) => {
    var _a, _b, _c, _d, _e;
    const moveMeTo = (target) => (0, util_creep_1.customMove)(creep, target, { ignoreCreeps: true });
    if (!isCarrier(creep)) {
        return console.log(`${creep.name} is not Harvester`);
    }
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
        changeMode(creep, "🛒");
    }
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        changeMode(creep, "💪");
    }
    const spawn = creep.pos.findClosestByRange(_((0, util_creep_1.getSpawnNamesInRoom)(creep.room))
        .map((name) => Game.spawns[name])
        .compact()
        .run());
    const store = Game.getObjectById(creep.memory.storeId);
    if (store && spawn) {
        creep.memory.worked = creep.withdraw(store, RESOURCE_ENERGY);
        switch (creep.memory.worked) {
            case ERR_NOT_ENOUGH_RESOURCES:
                if (creep.store.energy > 0 && store.store.energy === 0) {
                    changeMode(creep, "💪");
                }
                break;
            case ERR_FULL:
                changeMode(creep, "💪");
                break;
            case ERR_NOT_IN_RANGE:
                if (creep.memory.mode === "🛒") {
                    moveMeTo(store);
                }
                break;
            case ERR_NOT_OWNER:
            case ERR_INVALID_TARGET:
            case ERR_INVALID_ARGS:
                console.log(`${creep.name} transfer returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
                creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]);
                break;
            case OK:
            case ERR_BUSY:
            default:
                if (creep.store.energy > 0 && store.store.energy < creep.store.getCapacity(RESOURCE_ENERGY)) {
                    changeMode(creep, "💪");
                }
                break;
        }
    }
    else {
        return creep.suicide();
    }
    if (!creep.memory.transferId) {
        const rangeToClosestSpawn = ((_a = store.pos.findClosestByRange((0, util_creep_1.getSpawnNamesInRoom)(store.room).map((name) => Game.spawns[name]))) === null || _a === void 0 ? void 0 : _a.pos.getRangeTo(store)) || 0;
        const { spawn: spawns = [], container = [], extension = [], link = [], tower = [], } = creep.room
            .find(FIND_STRUCTURES, {
            filter: (s) => {
                return (s.id !== store.id &&
                    "store" in s &&
                    s.store.getFreeCapacity(RESOURCE_ENERGY) !== 0 &&
                    ([STRUCTURE_TOWER, STRUCTURE_EXTENSION, STRUCTURE_SPAWN].some((t) => s.structureType === t) ? true : s.pos.getRangeTo(creep) < rangeToClosestSpawn));
            },
        })
            .reduce((storages, s) => {
            return Object.assign(Object.assign({}, storages), { [s.structureType]: (0, utils_common_1.defaultTo)(storages[s.structureType], []).concat(s) });
        }, {});
        if (!creep.memory.transferId) {
            creep.memory.transferId = (_b = creep.pos.findClosestByRange(link)) === null || _b === void 0 ? void 0 : _b.id;
        }
        if (!creep.memory.transferId) {
            creep.memory.transferId = (_c = creep.pos.findClosestByRange(_([...spawns, ...container, ...extension])
                .compact()
                .run())) === null || _c === void 0 ? void 0 : _c.id;
        }
        if (!creep.memory.transferId && creep.room.controller) {
            const store = creep.room.controller.pos.findClosestByRange(FIND_STRUCTURES, { filter: util_creep_1.isStoreTarget });
            if (store && store.id !== creep.memory.storeId && store.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                creep.memory.transferId = store.id;
            }
        }
        if (!creep.memory.transferId) {
            creep.memory.transferId = (_d = creep.pos.findClosestByRange(tower)) === null || _d === void 0 ? void 0 : _d.id;
        }
        if (!creep.memory.transferId) {
            creep.memory.transferId = (_e = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (s) => "store" in s && s.id !== creep.memory.storeId && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
            })) === null || _e === void 0 ? void 0 : _e.id;
        }
        if (!creep.memory.transferId) {
            return ERR_NOT_FOUND;
        }
    }
    const transferTarget = Game.getObjectById(creep.memory.transferId);
    if (!transferTarget) {
        creep.memory.transferId = undefined;
        return ERR_NOT_FOUND;
    }
    const returnVal = creep.transfer(transferTarget, RESOURCE_ENERGY);
    switch (returnVal) {
        case ERR_NOT_IN_RANGE:
            if (creep.memory.mode === "💪") {
                moveMeTo(transferTarget);
            }
            break;
        case ERR_NOT_ENOUGH_RESOURCES:
            changeMode(creep, "🛒");
            break;
        case ERR_INVALID_TARGET:
        case ERR_FULL:
            creep.memory.transferId = undefined;
            break;
        case ERR_NOT_OWNER:
        case ERR_INVALID_ARGS:
            console.log(`${creep.name} transfer returns ${util_creep_1.RETURN_CODE_DECODER[returnVal.toString()]}`);
            creep.say(util_creep_1.RETURN_CODE_DECODER[returnVal.toString()]);
            break;
        case OK:
            creep.pos.findInRange(FIND_STRUCTURES, 1, { filter: util_creep_1.isStoreTarget }).map((s) => creep.transfer(s, RESOURCE_ENERGY));
            break;
        case ERR_BUSY:
        default:
            break;
    }
    (0, util_creep_1.stealBy)(creep, ["harvester"]);
    (0, util_creep_1.pickUpAll)(creep);
};
exports.default = behavior;
function isCarrier(creep) {
    return creep.memory.role === "carrier";
}
function changeMode(creep, mode) {
    if (creep.memory.mode !== mode) {
        creep.say(mode);
        creep.memory.mode = mode;
        creep.memory.transferId = undefined;
    }
}
