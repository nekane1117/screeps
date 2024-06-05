"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const behavior = (creep) => {
    var _a, _b, _c, _d, _e;
    const moveMeTo = (target, opt) => (0, util_creep_1.customMove)(creep, target, Object.assign({ plainCost: 1, swampCost: 1 }, opt));
    if (!isUpgrader(creep)) {
        return console.log(`${creep.name} is not Upgrader`);
    }
    if (creep.name.startsWith("B") && Object.values(Game.constructionSites).length) {
        return Object.assign(creep.memory, { role: "builder", mode: "🛒" });
    }
    const controller = (_a = Game.rooms[creep.memory.baseRoom]) === null || _a === void 0 ? void 0 : _a.controller;
    if (!controller) {
        return creep.suicide();
    }
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        changeMode(creep, "💪");
    }
    else if (creep.store.energy === 0) {
        changeMode(creep, "🛒");
    }
    if (((_b = controller.sign) === null || _b === void 0 ? void 0 : _b.username) !== "Nekane") {
        const signed = creep.signController(controller, "Please teach me screeps");
        if (signed === ERR_NOT_IN_RANGE) {
            moveMeTo(controller);
        }
        else {
            console.log(`${creep.name}:${util_creep_1.RETURN_CODE_DECODER[signed.toString()]}`);
        }
    }
    creep.memory.worked = creep.upgradeController(controller);
    switch (creep.memory.worked) {
        case ERR_NOT_ENOUGH_RESOURCES:
            changeMode(creep, "🛒");
            break;
        case ERR_NOT_IN_RANGE:
            if (creep.memory.mode === "💪") {
                moveMeTo(controller);
            }
            break;
        case ERR_NOT_OWNER:
        case ERR_INVALID_TARGET:
        case ERR_NO_BODYPART:
            console.log(`${creep.name} upgradeController returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
            creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]);
            break;
        case OK:
        case ERR_BUSY:
        default:
            break;
    }
    if (creep.memory.storeId ||
        (creep.memory.storeId = (_c = controller.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => {
                return (0, util_creep_1.isStoreTarget)(s) && ![STRUCTURE_SPAWN, STRUCTURE_EXTENSION].some((t) => t === s.structureType) && !!(controller === null || controller === void 0 ? void 0 : controller.pos.inRangeTo(s, 3));
            },
        })) === null || _c === void 0 ? void 0 : _c.id)) {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store) {
            creep.memory.collected = creep.withdraw(store, RESOURCE_ENERGY);
            switch (creep.memory.collected) {
                case ERR_INVALID_TARGET:
                    creep.memory.storeId = undefined;
                    break;
                case ERR_FULL:
                    changeMode(creep, "💪");
                    break;
                case ERR_NOT_IN_RANGE:
                    if (creep.memory.mode === "🛒") {
                        const moved = moveMeTo(store);
                        if (moved !== OK) {
                            console.log(`${creep.name} ${util_creep_1.RETURN_CODE_DECODER[moved.toString()]}`);
                            creep.say(util_creep_1.RETURN_CODE_DECODER[moved.toString()]);
                        }
                    }
                    break;
                case ERR_NOT_OWNER:
                case ERR_INVALID_ARGS:
                    console.log(`${creep.name} build returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
                    creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]);
                    break;
                case OK:
                case ERR_BUSY:
                case ERR_NOT_ENOUGH_RESOURCES:
                default:
                    break;
            }
        }
    }
    else {
        if (controller.pos.findInRange([
            ...creep.room.find(FIND_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_CONTAINER }),
            ...Object.values(Game.constructionSites).filter((s) => s.structureType === STRUCTURE_CONTAINER),
        ], 3).length === 0) {
            return (_e = (_d = controller.pos
                .findClosestByPath(Object.values(Game.spawns), { ignoreCreeps: true })) === null || _d === void 0 ? void 0 : _d.pos.findClosestByPath(_(_.range(-3, 4).map((dx) => {
                return _.range(-3, 4).map((dy) => {
                    return creep.room.getPositionAt(controller.pos.x + dx, controller.pos.y + dy);
                });
            }))
                .flatten(false)
                .compact()
                .run(), {
                ignoreCreeps: true,
                swampCost: 1,
            })) === null || _e === void 0 ? void 0 : _e.createConstructionSite(STRUCTURE_CONTAINER);
        }
    }
    (0, util_creep_1.pickUpAll)(creep);
};
exports.default = behavior;
function isUpgrader(creep) {
    return creep.memory.role === "upgrader";
}
const changeMode = (creep, mode) => {
    if (mode !== creep.memory.mode) {
        creep.say(mode);
        creep.memory.storeId = undefined;
        creep.memory.mode = mode;
    }
};
