"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (creep) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const { room } = creep;
    const moveMeTo = (target, opt) => {
        (0, util_creep_1.customMove)(creep, target, Object.assign({ plainCost: 2 }, opt));
    };
    if (!isCarrier(creep)) {
        return console.log(`${creep.name} is not Carrier`);
    }
    function checkMode() {
        var _a;
        if (!isCarrier(creep)) {
            return console.log(`${creep.name} is not Carrier`);
        }
        const newMode = ((c) => {
            if (c.memory.mode === "🚛" && creep.store.energy === 0) {
                return "🛒";
            }
            if (c.memory.mode === "🛒" && creep.store.energy >= (creep.room.controller ? EXTENSION_ENERGY_CAPACITY[creep.room.controller.level] : CARRY_CAPACITY)) {
                return "🚛";
            }
            return c.memory.mode;
        })(creep);
        if (creep.memory.mode !== newMode) {
            creep.say(newMode);
            creep.memory.mode = newMode;
            if (newMode === "🛒") {
                creep.memory.storeId = undefined;
            }
            creep.memory.transferId = undefined;
            if (newMode === "🚛") {
                (creep.room.memory.carrySize = creep.room.memory.carrySize || {}).carrier =
                    ((((_a = creep.room.memory.carrySize) === null || _a === void 0 ? void 0 : _a.carrier) || 100) * 100 + creep.store.energy) / 101;
            }
        }
    }
    checkMode();
    const mainSpawn = (0, util_creep_1.getMainSpawn)(room);
    if (!mainSpawn) {
        return creep.say("spawn not found");
    }
    const { extension, spawn: spawns, link, tower, container: containers, lab: labs } = (0, utils_1.findMyStructures)(room);
    const controllerContaeiner = room.controller && _(room.controller.pos.findInRange(containers, 3)).first();
    if (creep.memory.storeId) {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store && "store" in store && store.store.energy < CARRY_CAPACITY) {
            creep.memory.storeId = undefined;
        }
    }
    if (!creep.memory.storeId) {
        creep.memory.storeId = (_a = (() => {
            const extructor = mainSpawn.pos.findClosestByRange(link);
            return extructor && extructor.store.energy >= CARRY_CAPACITY ? extructor : undefined;
        })()) === null || _a === void 0 ? void 0 : _a.id;
    }
    if (!creep.memory.storeId && room.energyAvailable < room.energyCapacityAvailable) {
        creep.memory.storeId = (_b = creep.pos.findClosestByRange(_.compact([room.storage, ...containers]), {
            filter: (s) => {
                return (containers.length < 2 || (controllerContaeiner === null || controllerContaeiner === void 0 ? void 0 : controllerContaeiner.id) !== s.id) && s.store.energy > 0;
            },
        })) === null || _b === void 0 ? void 0 : _b.id;
    }
    if (!creep.memory.storeId && room.energyAvailable < room.energyCapacityAvailable && (((_c = room.terminal) === null || _c === void 0 ? void 0 : _c.store.energy) || 0) >= CARRY_CAPACITY) {
        creep.memory.storeId = (_d = room.terminal) === null || _d === void 0 ? void 0 : _d.id;
    }
    if (!creep.memory.storeId) {
        creep.memory.storeId = (_e = creep.pos.findClosestByRange(containers, {
            filter: (s) => {
                return (containers.length < 2 || (controllerContaeiner === null || controllerContaeiner === void 0 ? void 0 : controllerContaeiner.id) !== s.id) && s.store.energy >= CARRY_CAPACITY;
            },
        })) === null || _e === void 0 ? void 0 : _e.id;
    }
    if (!creep.memory.storeId) {
        creep.memory.storeId = (_f = creep.pos.findClosestByRange(_.compact([room.storage, room.terminal]), {
            filter: (s) => {
                return s.store.energy >= room.energyCapacityAvailable + creep.store.getCapacity(RESOURCE_ENERGY);
            },
        })) === null || _f === void 0 ? void 0 : _f.id;
    }
    if (!creep.memory.storeId) {
        const storageOrHarvester = creep.room.storage || creep.pos.findClosestByRange((0, util_creep_1.getCreepsInRoom)(creep.room).harvester || [], { filter: (c) => c.store.energy > 0 });
        if (storageOrHarvester && !creep.pos.isNearTo(storageOrHarvester)) {
            moveMeTo(storageOrHarvester, { range: 1 });
        }
    }
    if (creep.memory.storeId && creep.memory.mode === "🛒") {
        const store = Game.getObjectById(creep.memory.storeId);
        if (store) {
            if (!creep.pos.isNearTo(store)) {
                moveMeTo(store);
            }
            if (creep.pos.isNearTo(store)) {
                creep.memory.worked = creep.withdraw(store, RESOURCE_ENERGY);
                switch (creep.memory.worked) {
                    case ERR_NOT_ENOUGH_RESOURCES:
                        creep.memory.storeId = undefined;
                        checkMode();
                        break;
                    case ERR_FULL:
                        checkMode();
                        break;
                    case ERR_NOT_IN_RANGE:
                    case ERR_NOT_OWNER:
                    case ERR_INVALID_TARGET:
                    case ERR_INVALID_ARGS:
                        console.log(`${creep.name} transfer returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
                        creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]);
                        break;
                    case OK:
                    case ERR_BUSY:
                    default:
                        creep.memory.storeId = undefined;
                        checkMode();
                        break;
                }
            }
        }
    }
    if (creep.memory.transferId) {
        const store = Game.getObjectById(creep.memory.transferId);
        if (store && "store" in store && store.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
            creep.memory.transferId = undefined;
        }
    }
    const exclusive = ({ id }) => _((0, util_creep_1.getCreepsInRoom)(room).carrier || [])
        .compact()
        .every((g) => { var _a; return ((_a = g === null || g === void 0 ? void 0 : g.memory) === null || _a === void 0 ? void 0 : _a.transferId) !== id; });
    if (!creep.memory.transferId) {
        const targets = _([...extension, ...spawns]).filter((s) => s.store.getFreeCapacity(RESOURCE_ENERGY));
        const min = targets
            .map((e) => {
            return Math.atan2(e.pos.x - mainSpawn.pos.x, e.pos.y - mainSpawn.pos.y);
        })
            .min();
        creep.memory.transferId = (_g = creep.pos.findClosestByRange(targets
            .filter((s) => {
            return Math.atan2(s.pos.x - mainSpawn.pos.x, s.pos.y - mainSpawn.pos.y) <= min;
        })
            .value())) === null || _g === void 0 ? void 0 : _g.id;
    }
    if (!creep.memory.transferId) {
        creep.memory.transferId = (_h = creep.pos.findClosestByRange(tower, {
            filter: (t) => {
                return (0, utils_1.getCapacityRate)(t) < 0.9 && (tower.length < 2 || exclusive(t));
            },
        })) === null || _h === void 0 ? void 0 : _h.id;
    }
    if (!creep.memory.transferId && room.storage && room.storage.store.energy < room.energyCapacityAvailable) {
        creep.memory.transferId = room.storage.id;
    }
    if (!creep.memory.transferId) {
        creep.memory.transferId = (_j = _(labs)
            .filter((lab) => (0, utils_1.getCapacityRate)(lab) < 0.8)
            .sort((l1, l2) => l1.store.energy - l2.store.energy)
            .first()) === null || _j === void 0 ? void 0 : _j.id;
    }
    if (!creep.memory.transferId && room.terminal && room.terminal.store.energy < room.energyCapacityAvailable) {
        creep.memory.transferId = room.terminal.id;
    }
    if (!creep.memory.transferId) {
        creep.memory.transferId = (_k = (controllerContaeiner && (0, utils_1.getCapacityRate)(controllerContaeiner) < 0.9 ? controllerContaeiner : undefined)) === null || _k === void 0 ? void 0 : _k.id;
    }
    if (!creep.memory.transferId) {
        creep.memory.transferId = (_l = _([room.storage, room.terminal])
            .compact()
            .sortBy((s) => s.store.energy)
            .first()) === null || _l === void 0 ? void 0 : _l.id;
    }
    if (!creep.memory.transferId) {
        return ERR_NOT_FOUND;
    }
    if (creep.memory.transferId && creep.memory.mode === "🚛") {
        const transferTarget = Game.getObjectById(creep.memory.transferId);
        if (transferTarget) {
            if (!creep.pos.isNearTo(transferTarget)) {
                moveMeTo(transferTarget);
            }
            if (creep.pos.isNearTo(transferTarget)) {
                const returnVal = creep.transfer(transferTarget, RESOURCE_ENERGY);
                switch (returnVal) {
                    case ERR_NOT_ENOUGH_RESOURCES:
                        checkMode();
                        break;
                    case ERR_INVALID_TARGET:
                    case ERR_FULL:
                        creep.memory.transferId = undefined;
                        break;
                    case ERR_NOT_IN_RANGE:
                    case ERR_NOT_OWNER:
                    case ERR_INVALID_ARGS:
                        console.log(`${creep.name} transfer returns ${util_creep_1.RETURN_CODE_DECODER[returnVal.toString()]}`);
                        creep.say(util_creep_1.RETURN_CODE_DECODER[returnVal.toString()]);
                        break;
                    case OK:
                    case ERR_BUSY:
                    default:
                        if ((0, utils_1.getCapacityRate)(transferTarget) > 0.9) {
                            creep.memory.transferId = undefined;
                        }
                        break;
                }
            }
            else {
                _([...extension, ...spawns].filter((e) => creep.pos.isNearTo(e) && e.store.getFreeCapacity(RESOURCE_ENERGY)))
                    .tap(([head]) => {
                    if (head) {
                        creep.transfer(head, RESOURCE_ENERGY);
                    }
                })
                    .run();
            }
        }
        else {
            creep.memory.transferId = undefined;
        }
    }
    (0, util_creep_1.withdrawBy)(creep, ["harvester"]);
    (0, util_creep_1.pickUpAll)(creep);
};
exports.default = behavior;
function isCarrier(creep) {
    return creep.memory.role === "carrier";
}
