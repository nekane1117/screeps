"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const behavior = (creep) => {
    var _a, _b, _c, _d;
    if (!isRepairer(creep)) {
        return console.log(`${creep.name} is not Repairer`);
    }
    const moveMeTo = (target, opt) => (0, util_creep_1.customMove)(creep, target, Object.assign({ ignoreCreeps: !creep.pos.inRangeTo(target, 2) }, opt));
    const checkMode = () => {
        const newMode = ((c) => {
            if (c.memory.mode === "🔧" && creep.store.getUsedCapacity() === 0) {
                return "🛒";
            }
            if (c.memory.mode === "🛒" && creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
                return "🔧";
            }
            return c.memory.mode;
        })(creep);
        if (newMode !== creep.memory.mode) {
            creep.memory.mode = newMode;
            creep.memory.targetId = undefined;
            creep.memory.storeId = undefined;
            creep.say(creep.memory.mode);
        }
    };
    checkMode();
    if (creep.memory.targetId ||
        (creep.memory.targetId = (_a = _(creep.room.find(FIND_STRUCTURES, {
            filter: (s) => s.hits < s.hitsMax,
        })).min((s) => s.hits * ROAD_DECAY_TIME + ("ticksToDecay" in s ? s.ticksToDecay || 0 : ROAD_DECAY_TIME - 1))) === null || _a === void 0 ? void 0 : _a.id)) {
        const target = Game.getObjectById(creep.memory.targetId);
        if (target) {
            switch (creep.repair(target)) {
                case ERR_NOT_IN_RANGE:
                    if (creep.memory.mode === "🔧") {
                        moveMeTo(target);
                    }
                    break;
                case OK:
                    creep.move(creep.pos.getDirectionTo(target));
                    creep.memory.targetId = (_b = _(creep.pos.findInRange(FIND_STRUCTURES, 3, { filter: (s) => s.structureType === target.structureType && s.hits < s.hitsMax })).min((s) => s.hits)) === null || _b === void 0 ? void 0 : _b.id;
                    break;
                default:
                    break;
            }
        }
    }
    if (((_c = (creep.memory.storeId && Game.getObjectById(creep.memory.storeId))) === null || _c === void 0 ? void 0 : _c.store.getFreeCapacity(RESOURCE_ENERGY)) === 0) {
        creep.memory.storeId = undefined;
    }
    if (creep.memory.storeId ||
        (creep.memory.storeId = (_d = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) => {
                return (s.structureType !== STRUCTURE_SPAWN &&
                    (0, util_creep_1.isStoreTarget)(s) &&
                    s.structureType !== STRUCTURE_LINK &&
                    (s.room.energyAvailable / s.room.energyCapacityAvailable > 0.9 ? true : s.structureType !== STRUCTURE_EXTENSION) &&
                    s.store.energy > CARRY_CAPACITY);
            },
        })) === null || _d === void 0 ? void 0 : _d.id)) {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store) {
            creep.memory.worked = creep.withdraw(store, RESOURCE_ENERGY);
            switch (creep.memory.worked) {
                case ERR_NOT_ENOUGH_RESOURCES:
                case ERR_INVALID_TARGET:
                    creep.memory.storeId = undefined;
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
                    console.log(`${creep.name} withdraw returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
                    creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]);
                    break;
                case OK:
                case ERR_FULL:
                case ERR_BUSY:
                default:
                    if (store.store.getUsedCapacity(RESOURCE_ENERGY) < creep.getActiveBodyparts(CARRY) * CARRY_CAPACITY) {
                        creep.memory.storeId = undefined;
                    }
                    break;
            }
        }
    }
    (0, util_creep_1.withdrawBy)(creep, ["harvester", "upgrader"]);
    (0, util_creep_1.pickUpAll)(creep);
};
exports.default = behavior;
function isRepairer(creep) {
    return creep.memory.role === "repairer";
}
