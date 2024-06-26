"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (creep) => {
    var _a, _b, _c, _d;
    if (!isBuilder(creep)) {
        return console.log(`${creep.name} is not Builder`);
    }
    const moveMeTo = (target, opt) => {
        var _a;
        const pos = "pos" in target ? target.pos : target;
        (_a = Game.rooms[pos.roomName]) === null || _a === void 0 ? void 0 : _a.visual.text("x", pos, {
            color: (0, util_creep_1.toColor)(creep),
        });
        return (0, util_creep_1.customMove)(creep, target, Object.assign({}, opt));
    };
    const checkMode = () => {
        const newMode = ((c) => {
            if (c.memory.mode === "👷" && c.store.energy === 0) {
                return "🛒";
            }
            if (c.memory.mode === "🛒" && creep.store.energy >= CARRY_CAPACITY) {
                return "👷";
            }
            return c.memory.mode;
        })(creep);
        if (newMode !== creep.memory.mode) {
            creep.memory.mode = newMode;
            creep.memory.firstAidId = undefined;
            creep.memory.buildingId = undefined;
            creep.memory.storeId = undefined;
            creep.say(creep.memory.mode);
        }
    };
    checkMode();
    const { spawn, storage, terminal, road, rampart, container } = (0, utils_1.findMyStructures)(creep.room);
    if (creep.memory.mode === "👷") {
        if (creep.memory.firstAidId) {
            const target = Game.getObjectById(creep.memory.firstAidId);
            if (!target || target.hits > (0, utils_1.getDecayAmount)(target) * 10) {
                creep.memory.firstAidId = undefined;
            }
        }
        if (!creep.memory.firstAidId) {
            creep.memory.firstAidId = (_a = _([...road, ...rampart, ...container])
                .filter((s) => {
                return s.hits <= (0, utils_1.getDecayAmount)(s) * 10;
            })
                .sortBy((s) => s.hits / ((0, utils_1.getDecayAmount)(s) * 10))
                .first()) === null || _a === void 0 ? void 0 : _a.id;
        }
        if (creep.memory.firstAidId) {
            if (!isBoosted(creep) && boost(creep) !== null) {
                return;
            }
            const target = Game.getObjectById(creep.memory.firstAidId);
            if (target) {
                return _(creep.repair(target))
                    .tap((code) => {
                    if (code === ERR_NOT_IN_RANGE) {
                        if (creep.memory.mode === "👷") {
                            moveMeTo(target);
                        }
                    }
                })
                    .run();
            }
        }
        const energyStored = _([spawn, storage, terminal])
            .flatten()
            .compact()
            .sum((s) => s.store.energy);
        if (_([spawn, storage, terminal])
            .flatten()
            .compact()
            .sum((s) => s.store.energy) <
            creep.room.energyCapacityAvailable * 2 &&
            ((_b = creep.room.controller) === null || _b === void 0 ? void 0 : _b.pos.findInRange(container, 3).some((c) => c.store.energy > 0))) {
            return creep.say((creep.room.energyCapacityAvailable - energyStored).toString());
        }
        if (creep.memory.buildingId) {
            const target = Game.getObjectById(creep.memory.buildingId);
            if (!target) {
                creep.memory.buildingId = undefined;
            }
        }
        if (creep.memory.buildingId ||
            (creep.memory.buildingId = findBuildTarget(creep))) {
            if (!isBoosted(creep) && boost(creep) !== null) {
                return;
            }
            const site = Game.getObjectById(creep.memory.buildingId);
            if (site) {
                return _((creep.memory.built = creep.build(site)))
                    .tap((built) => {
                    switch (built) {
                        case ERR_INVALID_TARGET:
                            creep.memory.buildingId = undefined;
                            break;
                        case ERR_NOT_IN_RANGE:
                            moveMeTo(site);
                            break;
                        case ERR_NOT_OWNER:
                        case ERR_NO_BODYPART:
                            console.log(`${creep.name} build returns ${util_creep_1.RETURN_CODE_DECODER[built === null || built === void 0 ? void 0 : built.toString()]}`);
                            creep.say(util_creep_1.RETURN_CODE_DECODER[built === null || built === void 0 ? void 0 : built.toString()]);
                            break;
                        case OK:
                        case ERR_BUSY:
                        case ERR_NOT_ENOUGH_RESOURCES:
                        default:
                            break;
                    }
                })
                    .run();
            }
        }
        if (creep.memory.repairId) {
            const target = creep.memory.repairId && Game.getObjectById(creep.memory.repairId);
            if (!target || target.hits === target.hitsMax) {
                creep.memory.repairId = undefined;
            }
        }
        if (creep.memory.repairId || (creep.memory.repairId = findRepairTarget(creep))) {
            const target = creep.memory.repairId && Game.getObjectById(creep.memory.repairId);
            if (target) {
                if (!isBoosted(creep) && boost(creep) !== null) {
                    return;
                }
                target.room.visual.text("x", target.pos, {
                    opacity: 1 - _.ceil(target.hits / target.hitsMax, 1),
                });
                return _(creep.repair(target))
                    .tap((repaired) => {
                    var _a;
                    switch (repaired) {
                        case ERR_NOT_IN_RANGE:
                            return moveMeTo(target);
                        case OK:
                            creep.memory.repairId = (_a = _(creep.pos.findInRange(FIND_STRUCTURES, 4, { filter: (s) => s.structureType === target.structureType && s.hits < s.hitsMax })).min((s) => s.hits)) === null || _a === void 0 ? void 0 : _a.id;
                            return;
                        default:
                            return;
                    }
                })
                    .run();
            }
        }
    }
    else {
        if (creep.memory.storeId && ((_c = Game.getObjectById(creep.memory.storeId)) === null || _c === void 0 ? void 0 : _c.store.energy) === 0) {
            creep.memory.storeId = undefined;
        }
        const { container } = (0, utils_1.findMyStructures)(creep.room);
        if (creep.memory.storeId ||
            (creep.memory.storeId = (_d = creep.pos.findClosestByPath(_.compact([...container, creep.room.terminal, creep.room.storage]), {
                filter: (s) => {
                    return s.store.energy >= creep.store.getCapacity(RESOURCE_ENERGY);
                },
            })) === null || _d === void 0 ? void 0 : _d.id)) {
            const store = Game.getObjectById(creep.memory.storeId);
            if (store && "store" in store) {
                creep.memory.worked = creep.withdraw(store, RESOURCE_ENERGY);
                switch (creep.memory.worked) {
                    case ERR_NOT_ENOUGH_RESOURCES:
                    case ERR_INVALID_TARGET:
                        creep.memory.storeId = undefined;
                        break;
                    case ERR_NOT_IN_RANGE:
                        _(moveMeTo(store))
                            .tap((moved) => {
                            if (moved !== OK) {
                                console.log(`${creep.name} ${util_creep_1.RETURN_CODE_DECODER[moved.toString()]}`);
                                creep.say(util_creep_1.RETURN_CODE_DECODER[moved.toString()]);
                            }
                        })
                            .run();
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
        (0, util_creep_1.withdrawBy)(creep, ["harvester", "upgrader", "remoteHarvester"]);
        (0, util_creep_1.pickUpAll)(creep);
    }
};
exports.default = behavior;
function isBuilder(creep) {
    return creep.memory.role === "builder";
}
const boosts = [RESOURCE_CATALYZED_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_HYDRIDE];
function isBoosted(creep) {
    return !creep.body.some((b) => b.type === WORK && b.boost === undefined);
}
function boost(creep) {
    var _a;
    const moveMeTo = (target, opt) => (0, util_creep_1.customMove)(creep, target, Object.assign({}, opt));
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
        else {
            return null;
        }
    }
    else {
        return null;
    }
}
function findBuildTarget(creep) {
    var _a;
    return (_a = _((0, utils_1.getSitesInRoom)(Game.rooms[creep.memory.baseRoom]))
        .sortBy((s) => {
        return (s.progressTotal - s.progress) * (s.pos.getRangeTo(creep) + 1);
    })
        .first()) === null || _a === void 0 ? void 0 : _a.id;
}
function findRepairTarget(creep) {
    var _a;
    return (_a = _(creep.room.find(FIND_STRUCTURES, {
        filter: (s) => {
            return s.hits < s.hitsMax - (0, util_creep_1.getRepairPower)(creep);
        },
    }))
        .sortBy((s) => s.hits * ROAD_DECAY_TIME + ("ticksToDecay" in s ? s.ticksToDecay || 0 : ROAD_DECAY_TIME))
        .first()) === null || _a === void 0 ? void 0 : _a.id;
}
