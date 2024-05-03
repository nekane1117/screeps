"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_common_1 = require("./utils.common");
const behavior = (creep) => {
    var _a, _b;
    if (!isCarrier(creep)) {
        return console.log(`${creep.name} is not Harvester`);
    }
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
        changeMode(creep, "collecting");
    }
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        changeMode(creep, "working");
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
                    changeMode(creep, "working");
                }
                break;
            case ERR_FULL:
                changeMode(creep, "working");
                break;
            case ERR_NOT_IN_RANGE:
                if (creep.memory.mode === "collecting") {
                    (0, util_creep_1.customMove)(creep, store);
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
                    changeMode(creep, "working");
                }
                break;
        }
    }
    else {
        return creep.suicide();
    }
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
    const visualizePath = !creep.memory.transferId;
    if (!creep.memory.transferId) {
        creep.memory.transferId = (_b = (creep.pos.findClosestByRange(link) ||
            creep.pos.findClosestByRange(_([...spawns, ...container, ...extension])
                .compact()
                .run()) ||
            creep.pos.findClosestByRange(tower) ||
            creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (s) => "store" in s && s.id !== creep.memory.storeId && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
            }))) === null || _b === void 0 ? void 0 : _b.id;
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
            if (creep.memory.mode === "working") {
                (0, util_creep_1.customMove)(creep, transferTarget, {
                    visualizePathStyle: visualizePath ? {} : undefined,
                });
            }
            break;
        case ERR_NOT_ENOUGH_RESOURCES:
            changeMode(creep, "collecting");
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
    (0, util_creep_1.stealBy)(creep, ["harvester", "carrier"]);
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
