"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (creep) => {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!isRepairer(creep)) {
        return console.log(`${creep.name} is not Repairer`);
    }
    const moveMeTo = (target, opt) => (0, util_creep_1.customMove)(creep, target, Object.assign({}, opt));
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
    const { road, rampart, container } = (0, utils_1.findMyStructures)(creep.room);
    const repairPower = _(creep.body)
        .filter((b) => b.type === WORK)
        .sum((b) => {
        return (REPAIR_POWER *
            (() => {
                var _a;
                const boost = b.boost;
                const workBoosts = BOOSTS.work;
                if (typeof boost === "string") {
                    return ((_a = workBoosts[boost]) === null || _a === void 0 ? void 0 : _a.repair) || 1;
                }
                else {
                    return 1;
                }
            })());
    });
    if (creep.memory.targetId ||
        (creep.memory.targetId = (_a = creep.pos.findClosestByRange([...road, ...rampart, ...container], {
            filter: (s) => {
                return (s.hits <=
                    (() => {
                        switch (s.structureType) {
                            case "container":
                                return CONTAINER_DECAY;
                            case "rampart":
                                return RAMPART_DECAY_AMOUNT;
                            case "road":
                                switch (_(s.pos.lookFor(LOOK_TERRAIN)).first()) {
                                    case "wall":
                                        return constants_1.ROAD_DECAY_AMOUNT_WALL;
                                    case "swamp":
                                        return constants_1.ROAD_DECAY_AMOUNT_SWAMP;
                                    case "plain":
                                    default:
                                        return ROAD_DECAY_AMOUNT;
                                }
                        }
                    })() *
                        10);
            },
        })) === null || _a === void 0 ? void 0 : _a.id) ||
        (creep.memory.targetId = (_b = _(creep.room.find(FIND_STRUCTURES, {
            filter: (s) => {
                return s.hits <= s.hitsMax - repairPower;
            },
        })).min((s) => s.hits * ROAD_DECAY_TIME + ("ticksToDecay" in s ? s.ticksToDecay || 0 : ROAD_DECAY_TIME))) === null || _b === void 0 ? void 0 : _b.id)) {
        const target = Game.getObjectById(creep.memory.targetId);
        if (target) {
            const labs = (0, utils_1.findMyStructures)(creep.room).lab.map((lab) => {
                return Object.assign(lab, {
                    memory: creep.room.memory.labs[lab.id],
                });
            });
            const parts = creep.body.filter((b) => b.type === WORK);
            if (!creep.body.filter((b) => b.type === WORK).find((e) => boosts.includes(e.boost))) {
                const lab = (_c = boosts
                    .map((mineralType) => {
                    return {
                        mineralType,
                        lab: labs.find((l) => {
                            return (l.mineralType === mineralType && l.store[mineralType] >= parts.length * LAB_BOOST_MINERAL && l.store.energy >= parts.length * LAB_BOOST_ENERGY);
                        }),
                    };
                })
                    .find((o) => o.lab)) === null || _c === void 0 ? void 0 : _c.lab;
                if (lab) {
                    if (creep.pos.isNearTo(lab)) {
                        return lab.boostCreep(creep);
                    }
                    else {
                        return moveMeTo(lab);
                    }
                }
            }
            target.room.visual.text("x", target.pos, {
                opacity: 1 - _.ceil(target.hits / target.hitsMax, 1),
            });
            switch (creep.repair(target)) {
                case ERR_NOT_IN_RANGE:
                    if (creep.memory.mode === "🔧") {
                        moveMeTo(target);
                    }
                    break;
                case OK:
                    creep.move(creep.pos.getDirectionTo(target));
                    creep.memory.targetId = (_d = _(creep.pos.findInRange(FIND_STRUCTURES, 3, { filter: (s) => s.structureType === target.structureType && s.hits < s.hitsMax })).min((s) => s.hits)) === null || _d === void 0 ? void 0 : _d.id;
                    break;
                default:
                    break;
            }
        }
        else {
            creep.memory.targetId = undefined;
        }
    }
    if (((_e = (creep.memory.storeId && Game.getObjectById(creep.memory.storeId))) === null || _e === void 0 ? void 0 : _e.store.getFreeCapacity(RESOURCE_ENERGY)) === 0) {
        creep.memory.storeId = undefined;
    }
    if (creep.memory.storeId ||
        (creep.memory.storeId = (_f = creep.room.storage) === null || _f === void 0 ? void 0 : _f.id) ||
        (creep.memory.storeId = (_g = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) => {
                return (s.structureType !== STRUCTURE_SPAWN &&
                    (0, util_creep_1.isStoreTarget)(s) &&
                    s.structureType !== STRUCTURE_LINK &&
                    (s.room.energyAvailable / s.room.energyCapacityAvailable > 0.9 ? true : s.structureType !== STRUCTURE_EXTENSION) &&
                    s.store.energy > CARRY_CAPACITY);
            },
        })) === null || _g === void 0 ? void 0 : _g.id)) {
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
const boosts = [RESOURCE_CATALYZED_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_HYDRIDE];
