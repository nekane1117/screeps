"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (creep) => {
    var _a, _b, _c, _d, _e;
    const moveMeTo = (target, opt) => (0, util_creep_1.customMove)(creep, target, Object.assign({}, opt));
    if (!isUpgrader(creep)) {
        return console.log(`${creep.name} is not Upgrader`);
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
    const { link, container } = (0, utils_1.findMyStructures)(creep.room);
    const links = link.filter((l) => {
        const s = (0, util_creep_1.getMainSpawn)(creep.room);
        return !(s && l.pos.inRangeTo(s, 1));
    });
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
    if (creep.memory.storeId && (((_c = Game.getObjectById(creep.memory.storeId)) === null || _c === void 0 ? void 0 : _c.store.energy) || 0) <= 0) {
        creep.memory.storeId = undefined;
    }
    if (creep.memory.storeId ||
        (creep.memory.storeId = (_d = controller.pos.findClosestByRange(_.compact([...links, ...container]), {
            filter: (s) => s.pos.inRangeTo(controller, 3),
        })) === null || _d === void 0 ? void 0 : _d.id) ||
        (creep.memory.storeId = (_e = (() => {
            if (creep.room.energyAvailable < creep.room.energyCapacityAvailable) {
                return undefined;
            }
            else {
                return controller.pos.findClosestByRange(_.compact([
                    ...links,
                    ...container,
                    ..._([creep.room.storage, creep.room.terminal])
                        .compact()
                        .filter((s) => (s === null || s === void 0 ? void 0 : s.store.energy) > creep.room.energyCapacityAvailable)
                        .value(),
                ]), {
                    filter: (s) => {
                        return s.store.energy > 0;
                    },
                });
            }
        })()) === null || _e === void 0 ? void 0 : _e.id)) {
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
