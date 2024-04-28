"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const behavior = (creep) => {
    var _a, _b;
    if (!isUpgrader(creep)) {
        return console.log(`${creep.name} is not Upgrader`);
    }
    if (!creep.room.controller) {
        return creep.suicide();
    }
    // https://docs.screeps.com/simultaneous-actions.html
    // signController
    if (((_a = creep.room.controller.sign) === null || _a === void 0 ? void 0 : _a.username) !== "Nekane" && creep.name.endsWith("0")) {
        const signed = creep.signController(creep.room.controller, "Please teach me screeps");
        if (signed === ERR_NOT_IN_RANGE) {
            (0, util_creep_1.customMove)(creep, creep.room.controller);
        }
        else {
            console.log(`${creep.name}:${util_creep_1.RETURN_CODE_DECODER[signed.toString()]}`);
        }
    }
    // upgradeController
    creep.memory.worked = creep.upgradeController(creep.room.controller);
    switch (creep.memory.worked) {
        // 資源不足
        case ERR_NOT_ENOUGH_RESOURCES:
            changeMode(creep, "collecting");
            break;
        case ERR_NOT_IN_RANGE:
            if (creep.memory.mode === "working") {
                (0, util_creep_1.customMove)(creep, creep.room.controller);
            }
            break;
        // 有りえない系
        case ERR_NOT_OWNER:
        case ERR_INVALID_TARGET:
        case ERR_NO_BODYPART:
            console.log(`${creep.name} upgradeController returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
            creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]);
            break;
        // 問題ない系
        case OK:
        case ERR_BUSY:
        default:
            break;
    }
    if (creep.memory.storeId ||
        (creep.memory.storeId = (_b = creep.room.controller.pos.findClosestByPath(FIND_STRUCTURES, {
            // コントローラーから一番近い倉庫に行く
            filter: (s) => {
                return (0, util_creep_1.isStoreTarget)(s) && ![STRUCTURE_SPAWN, STRUCTURE_EXTENSION].some((t) => t === s.structureType);
            },
        })) === null || _b === void 0 ? void 0 : _b.id)) {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store) {
            creep.memory.collected = creep.withdraw(store, RESOURCE_ENERGY);
            switch (creep.memory.collected) {
                case ERR_NOT_ENOUGH_RESOURCES: // 空っぽ
                case ERR_INVALID_TARGET: // 対象が変
                    creep.memory.storeId = undefined;
                    break;
                // 満タンまで取った
                case ERR_FULL:
                    changeMode(creep, "working");
                    break;
                case ERR_NOT_IN_RANGE:
                    if (creep.memory.mode === "collecting") {
                        const moved = (0, util_creep_1.customMove)(creep, store);
                        if (moved !== OK) {
                            console.log(`${creep.name} ${util_creep_1.RETURN_CODE_DECODER[moved.toString()]}`);
                            creep.say(util_creep_1.RETURN_CODE_DECODER[moved.toString()]);
                        }
                    }
                    break;
                // 有りえない系
                case ERR_NOT_OWNER:
                case ERR_INVALID_ARGS:
                    console.log(`${creep.name} build returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
                    creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]);
                    break;
                // 問題ない系
                case OK:
                case ERR_BUSY:
                default:
                    break;
            }
        }
        else {
            creep.memory.storeId = undefined;
            (0, util_creep_1.randomWalk)(creep);
        }
    }
    else {
        (0, util_creep_1.randomWalk)(creep);
    }
    // withdraw
    // 落っこちてるものを拾う
    (0, util_creep_1.pickUpAll)(creep);
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        changeMode(creep, "working");
    }
    else if (creep.store[RESOURCE_ENERGY] === 0) {
        changeMode(creep, "collecting");
    }
};
exports.default = behavior;
function isUpgrader(creep) {
    return creep.memory.role === "upgrader";
}
const changeMode = (creep, mode) => {
    if (mode !== creep.memory.mode) {
        creep.say(mode);
        creep.memory.mode = mode;
        creep.memory.harvestTargetId = undefined;
        creep.memory.harvested = undefined;
    }
};
