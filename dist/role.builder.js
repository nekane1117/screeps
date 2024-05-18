"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const behavior = (creep) => {
    var _a, _b, _c;
    if (!isBuilder(creep)) {
        return console.log(`${creep.name} is not Builder`);
    }
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        changeMode(creep, "💪");
    }
    if (creep.store.energy < BUILD_POWER * creep.getActiveBodyparts(WORK)) {
        changeMode(creep, "🛒");
    }
    const sites = _(Object.values(Game.constructionSites));
    if (sites.size() === 0) {
        return (creep.memory.role = "repairer");
    }
    const minRemaining = sites.map((s) => s.progressTotal - s.progress).min();
    if (!(creep.memory.buildingId ||
        (creep.memory.buildingId = (_a = (creep.pos.findClosestByRange(sites.filter((s) => s.structureType === STRUCTURE_CONTAINER).run()) ||
            creep.pos.findClosestByRange(sites.filter((s) => s.progressTotal - s.progress <= minRemaining).run()))) === null || _a === void 0 ? void 0 : _a.id))) {
        return (creep.memory.role = "repairer");
    }
    else {
        const site = Game.getObjectById(creep.memory.buildingId);
        if (site) {
            switch ((creep.memory.built = creep.build(site))) {
                case ERR_NOT_ENOUGH_RESOURCES:
                    changeMode(creep, "🛒");
                    break;
                case ERR_INVALID_TARGET:
                    creep.memory.buildingId = undefined;
                    break;
                case ERR_NOT_IN_RANGE:
                    if (creep.memory.mode === "💪") {
                        (0, util_creep_1.customMove)(creep, site);
                    }
                    break;
                case ERR_NOT_OWNER:
                case ERR_NO_BODYPART:
                    console.log(`${creep.name} build returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.built.toString()]}`);
                    creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.built.toString()]);
                    break;
                case OK:
                case ERR_BUSY:
                default:
                    break;
            }
        }
        else {
            creep.memory.buildingId = undefined;
        }
    }
    if (creep.memory.storeId ||
        (creep.memory.storeId =
            creep.memory.buildingId &&
                ((_c = (_b = Game.getObjectById(creep.memory.buildingId)) === null || _b === void 0 ? void 0 : _b.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: (s) => {
                        return (s.structureType !== STRUCTURE_SPAWN &&
                            (0, util_creep_1.isStoreTarget)(s) &&
                            s.structureType !== STRUCTURE_LINK &&
                            (s.room.energyAvailable / s.room.energyCapacityAvailable > 0.9 ? true : s.structureType !== STRUCTURE_EXTENSION) &&
                            s.store.energy > 0);
                    },
                })) === null || _c === void 0 ? void 0 : _c.id))) {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store) {
            creep.memory.worked = creep.withdraw(store, RESOURCE_ENERGY);
            switch (creep.memory.worked) {
                case ERR_NOT_ENOUGH_RESOURCES:
                case ERR_INVALID_TARGET:
                    creep.memory.storeId = undefined;
                    break;
                case ERR_FULL:
                    changeMode(creep, "💪");
                    break;
                case ERR_NOT_IN_RANGE:
                    if (creep.memory.mode === "🛒") {
                        const moved = (0, util_creep_1.customMove)(creep, store);
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
                default:
                    if (store.store.getUsedCapacity(RESOURCE_ENERGY) < creep.getActiveBodyparts(CARRY) * CARRY_CAPACITY) {
                        creep.memory.storeId = undefined;
                        changeMode(creep, "💪");
                    }
                    break;
            }
        }
    }
    (0, util_creep_1.withdrawBy)(creep, ["harvester", "distributer", "upgrader"]);
    (0, util_creep_1.pickUpAll)(creep);
};
exports.default = behavior;
function isBuilder(creep) {
    return creep.memory.role === "builder";
}
const changeMode = (creep, mode) => {
    if (mode !== creep.memory.mode) {
        creep.memory.mode = mode;
        creep.memory.buildingId = undefined;
        creep.memory.storeId = undefined;
        creep.say(creep.memory.mode);
    }
};
