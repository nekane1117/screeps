"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const behavior = (creep) => {
    var _a, _b;
    if (!isCarrier(creep)) {
        return console.log(`${creep.name} is not Harvester`);
    }
    if (creep.memory.mode === "collecting") {
        const store = Game.getObjectById(creep.memory.storeId);
        if (!store) {
            return creep.suicide();
        }
        if (!creep.pos.isNearTo(store)) {
            creep.moveTo(store, {
                ignoreCreeps: creep.pos.getRangeTo(store) > 3,
                plainCost: 2,
            });
        }
        if (creep.pos.isNearTo(store)) {
            (0, utils_1.cond)([
                (0, utils_1.shallowEq)(ERR_FULL),
                () => {
                    changeMode(creep, "working");
                },
            ], [
                (0, utils_1.someOf)(ERR_NOT_OWNER, ERR_INVALID_TARGET, ERR_NOT_IN_RANGE, ERR_INVALID_ARGS),
                (value) => {
                    console.log(`${creep.name} withdraw return ${constants_1.RETURN_CODE_DECODER[value.toString()]}`);
                    creep.say(constants_1.RETURN_CODE_DECODER[value.toString()]);
                },
            ], [(0, utils_1.stubTrue)(), utils_1.noop])(creep.withdraw(store, RESOURCE_ENERGY));
        }
    }
    else {
        if (!creep.memory.transferId) {
            const { container = [], extension = [], spawn = [], storage = [], link = [], tower = [], } = creep.room
                .find(FIND_STRUCTURES, {
                filter: (s) => {
                    return s.id !== creep.memory.storeId && "store" in s && s.store.getFreeCapacity(RESOURCE_ENERGY) / s.store.getCapacity(RESOURCE_ENERGY) < 0.8;
                },
            })
                .reduce((structures, s) => {
                return Object.assign(Object.assign({}, structures), { [s.structureType]: (structures[s.structureType] || []).concat(s) });
            }, {});
            creep.memory.transferId =
                ((_a = creep.pos.findClosestByRange([...container, ...extension, ...spawn, ...storage, ...link])) === null || _a === void 0 ? void 0 : _a.id) || ((_b = creep.pos.findClosestByRange([...tower])) === null || _b === void 0 ? void 0 : _b.id);
            if (!creep.memory.transferId) {
                return ERR_NOT_FOUND;
            }
        }
        const transferTarget = Game.getObjectById(creep.memory.transferId);
        if (!transferTarget) {
            creep.memory.transferId = null;
            return ERR_NOT_FOUND;
        }
        if (!creep.pos.isNearTo(transferTarget)) {
            creep.moveTo(transferTarget, {
                ignoreCreeps: creep.pos.getRangeTo(transferTarget) > 3,
                plainCost: 2,
            });
        }
        if (creep.pos.isNearTo(transferTarget)) {
            (0, utils_1.cond)([
                (0, utils_1.shallowEq)(ERR_FULL),
                () => {
                    creep.memory.transferId = undefined;
                },
            ], [
                (0, utils_1.shallowEq)(ERR_NOT_ENOUGH_RESOURCES),
                () => {
                    changeMode(creep, "collecting");
                },
            ], [
                (0, utils_1.someOf)(ERR_NOT_OWNER, ERR_INVALID_TARGET, ERR_INVALID_ARGS),
                (value) => {
                    console.log(`${creep.name} withdraw return ${constants_1.RETURN_CODE_DECODER[value.toString()]}`);
                    creep.say(constants_1.RETURN_CODE_DECODER[value.toString()]);
                },
            ], [(0, utils_1.stubTrue)(), utils_1.noop])(creep.transfer(transferTarget, RESOURCE_ENERGY));
        }
    }
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
