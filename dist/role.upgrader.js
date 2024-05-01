"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const behavior = (creep) => {
    var _a, _b;
    if (!isUpgrader(creep)) {
        console.log(`${creep.name} is not upgrader`);
        return ERR_INVALID_TARGET;
    }
    if (!creep.room.controller) {
        return creep.suicide();
    }
    if (creep.memory.mode === "working") {
        const range = creep.pos.getRangeTo(creep.room.controller);
        if (range <= 3) {
            return creep.upgradeController(creep.room.controller);
        }
        else {
            creep.moveTo(creep.room.controller, {
                ignoreCreeps: range > 6,
                plainCost: 2,
            });
        }
    }
    else {
        if (!creep.memory.storeId) {
            const { container, extension, link, spawn, storage } = _(creep.room.find(FIND_STRUCTURES, {
                filter: (s) => "store" in s && s.store.getUsedCapacity(RESOURCE_ENERGY) > 0,
            })).reduce((mapper, s) => {
                return Object.assign(Object.assign({}, mapper), { [s.structureType]: (mapper[s.structureType] || []).concat(s) });
            }, {
                container: [],
                extension: [],
                link: [],
                spawn: [],
                storage: [],
            });
            creep.memory.storeId =
                ((_a = creep.room.controller.pos.findClosestByRange([...container, ...storage, ...link])) === null || _a === void 0 ? void 0 : _a.id) ||
                    ((_b = creep.room.controller.pos.findClosestByRange([...extension, ...spawn])) === null || _b === void 0 ? void 0 : _b.id);
            if (!creep.memory.storeId) {
                return ERR_NOT_FOUND;
            }
        }
        const store = Game.getObjectById(creep.memory.storeId);
        if (store) {
            const nearTo = creep.pos.isNearTo(store);
            if (!nearTo) {
                creep.moveTo(store, {
                    ignoreCreeps: creep.pos.getRangeTo(store) > 3,
                    plainCost: 2,
                });
            }
            if (creep.pos.isNearTo(store)) {
                (0, utils_1.cond)([
                    (0, utils_1.shallowEq)(ERR_NOT_ENOUGH_RESOURCES),
                    () => {
                        creep.memory.storeId = undefined;
                    },
                ], [
                    (0, utils_1.shallowEq)(ERR_FULL),
                    () => {
                        creep.memory.storeId = undefined;
                        creep.memory.mode = "working";
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
            creep.memory.storeId = undefined;
            return creep.say("no store");
        }
    }
};
exports.default = behavior;
function isUpgrader(c) {
    return "role" in c.memory && c.memory.role === "upgrader";
}
