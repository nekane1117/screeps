"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_array_1 = require("./util.array");
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (creep) => {
    var _a, _b, _c;
    if (!isBuilder(creep)) {
        return console.log(`${creep.name} is not Builder`);
    }
    const moveMeTo = (target, opt) => (0, util_creep_1.customMove)(creep, target, Object.assign({ ignoreCreeps: !creep.pos.inRangeTo(target, 4) }, opt));
    const checkMode = () => {
        const newMode = ((c) => {
            if (c.memory.mode === "💪" && c.store.energy === 0) {
                return "🛒";
            }
            if (c.memory.mode === "🛒" && creep.store.energy >= CARRY_CAPACITY) {
                return "💪";
            }
            return c.memory.mode;
        })(creep);
        if (newMode !== creep.memory.mode) {
            creep.memory.mode = newMode;
            creep.memory.buildingId = undefined;
            creep.memory.storeId = undefined;
            creep.say(creep.memory.mode);
        }
    };
    checkMode();
    const labs = (0, utils_1.findMyStructures)(creep.room).lab.map((lab) => {
        return Object.assign(lab, {
            memory: creep.room.memory.labs[lab.id],
        });
    });
    const parts = creep.body.filter((b) => b.type === WORK);
    if (!creep.body.filter((b) => b.type === WORK).find((e) => boosts.includes(e.boost))) {
        const lab = (_a = boosts
            .map((mineralType) => {
            return {
                mineralType,
                lab: labs.find((l) => {
                    return (l.mineralType === mineralType && l.store[mineralType] >= parts.length * LAB_BOOST_MINERAL && l.store.energy >= parts.length * LAB_BOOST_ENERGY);
                }),
            };
        })
            .find((o) => o.lab)) === null || _a === void 0 ? void 0 : _a.lab;
        if (lab) {
            if (creep.pos.isNearTo(lab)) {
                return lab.boostCreep(creep);
            }
            else {
                return moveMeTo(lab);
            }
        }
    }
    if (creep.memory.buildingId ||
        (creep.memory.buildingId = (_b = (0, util_array_1.complexOrder)(Object.values(Game.constructionSites), [
            (s) => (s.pos.roomName === creep.memory.baseRoom ? 0 : 1),
            (s) => {
                switch (s.structureType) {
                    case STRUCTURE_TOWER:
                        return 0;
                    case STRUCTURE_CONTAINER:
                        return 1;
                    default:
                        return 2;
                }
            },
            (s) => s.progressTotal - s.progress,
            (s) => s.pos.getRangeTo(creep),
        ]).first()) === null || _b === void 0 ? void 0 : _b.id)) {
        const site = Game.getObjectById(creep.memory.buildingId);
        if (site) {
            switch ((creep.memory.built = creep.build(site))) {
                case ERR_INVALID_TARGET:
                    creep.memory.buildingId = undefined;
                    break;
                case ERR_NOT_IN_RANGE:
                    if (creep.memory.mode === "💪") {
                        moveMeTo(site);
                    }
                    break;
                case ERR_NOT_OWNER:
                case ERR_NO_BODYPART:
                    console.log(`${creep.name} build returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.built.toString()]}`);
                    creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.built.toString()]);
                    break;
                case OK:
                case ERR_BUSY:
                case ERR_NOT_ENOUGH_RESOURCES:
                default:
                    break;
            }
        }
        else {
            creep.memory.buildingId = undefined;
        }
    }
    else {
        return creep.suicide();
    }
    if (creep.memory.storeId ||
        (creep.memory.storeId = (_c = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) => {
                return (s.structureType !== STRUCTURE_SPAWN &&
                    (0, util_creep_1.isStoreTarget)(s) &&
                    s.structureType !== STRUCTURE_LINK &&
                    (s.room.energyAvailable / s.room.energyCapacityAvailable > 0.9 ? true : s.structureType !== STRUCTURE_EXTENSION) &&
                    s.store.energy > CARRY_CAPACITY);
            },
            maxRooms: 2,
        })) === null || _c === void 0 ? void 0 : _c.id)) {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store) {
            creep.memory.worked = creep.withdraw(store, RESOURCE_ENERGY);
            switch (creep.memory.worked) {
                case ERR_NOT_ENOUGH_RESOURCES:
                case ERR_INVALID_TARGET:
                    creep.memory.storeId = undefined;
                    break;
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
    else if (creep.memory.mode === "🛒") {
        const harvester = creep.pos.findClosestByRange(Object.values(Game.creeps), { filter: (c) => c.memory.role === "harvester" });
        if (harvester && !creep.pos.isNearTo(harvester)) {
            moveMeTo(harvester);
        }
    }
    (0, util_creep_1.withdrawBy)(creep, ["harvester", "upgrader"]);
    (0, util_creep_1.pickUpAll)(creep);
};
exports.default = behavior;
function isBuilder(creep) {
    return creep.memory.role === "builder";
}
const boosts = [RESOURCE_CATALYZED_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_HYDRIDE];
