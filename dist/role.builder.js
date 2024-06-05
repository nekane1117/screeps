"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (creep) => {
    var _a, _b;
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
    if (creep.memory.mode === "👷") {
        if (creep.memory.firstAidId) {
            const target = Game.getObjectById(creep.memory.firstAidId);
            if (!target || target.hits === target.hitsMax) {
                creep.memory.firstAidId = undefined;
            }
        }
        const { road, rampart, container } = (0, utils_1.findMyStructures)(creep.room);
        if (!creep.memory.firstAidId) {
            creep.memory.firstAidId = (_a = creep.pos.findClosestByRange([...road, ...rampart, ...container], {
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
            })) === null || _a === void 0 ? void 0 : _a.id;
        }
        if (creep.memory.firstAidId) {
            if (!isBoosted(creep) && boost(creep)) {
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
        if (creep.memory.buildingId) {
            const target = Game.getObjectById(creep.memory.buildingId);
            if (!target) {
                creep.memory.buildingId = undefined;
            }
        }
        if (creep.memory.buildingId ||
            (creep.memory.buildingId = findBuildTarget(creep))) {
            if (!isBoosted(creep) && boost(creep)) {
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
                if (!isBoosted(creep) && boost(creep)) {
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
                            creep.move(creep.pos.getDirectionTo(target));
                            creep.memory.repairId = (_a = _(creep.pos.findInRange(FIND_STRUCTURES, 3, { filter: (s) => s.structureType === target.structureType && s.hits < s.hitsMax })).min((s) => s.hits)) === null || _a === void 0 ? void 0 : _a.id;
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
        creep.memory.storeId = (() => {
            const store = creep.memory.storeId && Game.getObjectById(creep.memory.storeId);
            if (!store || !("store" in store) || store.store.energy === 0) {
                return undefined;
            }
            else {
                return creep.memory.storeId;
            }
        })();
        if (creep.memory.storeId ||
            (creep.memory.storeId = (_b = creep.pos.findClosestByPath([...creep.room.find(FIND_TOMBSTONES), ...creep.room.find(FIND_RUINS), ...(0, utils_1.findMyStructures)(creep.room).all], {
                filter: (s) => {
                    if ("destroyTime" in s || "deathTime" in s) {
                        return s.store.energy > 0;
                    }
                    return ("store" in s &&
                        s.store.energy >= creep.store.getCapacity(RESOURCE_ENERGY) &&
                        ![STRUCTURE_TOWER, STRUCTURE_LINK, STRUCTURE_TERMINAL, STRUCTURE_EXTENSION, STRUCTURE_SPAWN].includes(s.structureType));
                },
            })) === null || _b === void 0 ? void 0 : _b.id)) {
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
        else {
            const harvester = creep.pos.findClosestByRange(Object.values(Game.creeps), {
                filter: (c) => c.memory.role === "harvester" || c.memory.role === "remoteHarvester",
            });
            if (harvester && !creep.pos.isNearTo(harvester)) {
                moveMeTo(harvester);
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
    return (_a = (() => {
        const sites = (0, utils_1.getSitesInRoom)(Game.rooms[creep.memory.baseRoom]);
        if (sites.length === 0) {
            return undefined;
        }
        const minRemaning = _(sites)
            .map((s) => s.progressTotal - s.progress)
            .min();
        return creep.pos.findClosestByRange(_(sites)
            .filter((s) => minRemaning === s.progressTotal - s.progress)
            .run());
    })()) === null || _a === void 0 ? void 0 : _a.id;
}
function findRepairTarget(creep) {
    var _a;
    return (_a = _(creep.room.find(FIND_STRUCTURES, {
        filter: (s) => {
            return (s.hits <=
                s.hitsMax -
                    _(creep.body)
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
                    }));
        },
    })).min((s) => s.hits * ROAD_DECAY_TIME + ("ticksToDecay" in s ? s.ticksToDecay || 0 : ROAD_DECAY_TIME))) === null || _a === void 0 ? void 0 : _a.id;
}
