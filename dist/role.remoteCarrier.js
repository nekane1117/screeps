"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (creep) => {
    var _a, _b, _c, _d, _e, _f;
    if (!isRemoteCarrier(creep)) {
        return console.log(`${creep.name} is not RemoteCarrier`);
    }
    const moveMeTo = (target, opt) => {
        return (0, util_creep_1.customMove)(creep, target, Object.assign({ plainCost: 2, swampCost: 3 }, opt));
    };
    const memory = (0, utils_1.readonly)(creep.memory);
    const preMode = memory.mode;
    if (creep.store.energy < CARRY_CAPACITY) {
        creep.memory.mode = "🛒";
    }
    else if (creep.room.name !== memory.baseRoom && creep.getActiveBodyparts(WORK) > 0 && (0, utils_1.getSitesInRoom)(creep.room).length > 0) {
        creep.memory.mode = "👷";
    }
    else {
        creep.memory.mode = "🚛";
        (creep.room.memory.carrySize = creep.room.memory.carrySize || {}).remoteCarrier =
            ((((_a = creep.room.memory.carrySize) === null || _a === void 0 ? void 0 : _a.remoteCarrier) || 100) * 100 + creep.store.energy) / 101;
    }
    if (memory.mode !== preMode) {
        creep.memory.storeId = undefined;
        creep.memory.transferId = undefined;
        creep.say(memory.mode);
    }
    if (memory.mode === "🚛") {
        const baseRoom = Game.rooms[memory.baseRoom];
        if (baseRoom) {
            if (memory.transferId && (((_b = Game.getObjectById(memory.transferId)) === null || _b === void 0 ? void 0 : _b.store.getFreeCapacity(RESOURCE_ENERGY)) || 0) === 0) {
                creep.memory.transferId = undefined;
            }
            if (!memory.transferId) {
                const { container, link } = (0, utils_1.findMyStructures)(baseRoom);
                const targets = _.compact([
                    ...container.filter((c) => {
                        return baseRoom.find(FIND_MINERALS).some((m) => !c.pos.inRangeTo(m, 3));
                    }),
                    ...link,
                    creep.room.storage,
                    creep.room.terminal,
                ]).filter((s) => s.structureType === STRUCTURE_LINK || s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                const searched = PathFinder.search(creep.pos, targets.map((t) => t.pos), { plainCost: 2, swampCost: 10 });
                if (!searched.incomplete && searched.path.length > 0) {
                    creep.memory.transferId = (_c = _(searched.path).last().findClosestByRange(targets)) === null || _c === void 0 ? void 0 : _c.id;
                }
            }
            const transferTarget = memory.transferId && Game.getObjectById(memory.transferId);
            if (transferTarget) {
                _(creep.transfer(transferTarget, RESOURCE_ENERGY))
                    .tap((result) => {
                    switch (result) {
                        case OK:
                            break;
                        case ERR_NOT_IN_RANGE:
                            moveMeTo(transferTarget);
                            break;
                        default:
                            creep.say(util_creep_1.RETURN_CODE_DECODER[result.toString()].replace("ERR_", ""));
                            console.log(creep.name, creep.saying);
                            break;
                    }
                })
                    .run();
            }
        }
    }
    else if (memory.mode === "👷") {
        if (creep.getActiveBodyparts(WORK) === 0) {
            return (creep.memory.mode = "🚛");
        }
        const sites = (0, utils_1.getSitesInRoom)(creep.room);
        if (memory.siteId && !Game.getObjectById(memory.siteId)) {
            creep.memory.siteId = undefined;
        }
        if (!memory.siteId) {
            creep.memory.siteId = (_d = creep.pos.findClosestByPath(sites)) === null || _d === void 0 ? void 0 : _d.id;
        }
        const site = memory.siteId && Game.getObjectById(memory.siteId);
        if (site) {
            _(creep.build(site))
                .tap((result) => {
                switch (result) {
                    case OK:
                        break;
                    case ERR_NOT_IN_RANGE:
                        moveMeTo(site);
                        break;
                    default:
                        creep.say(util_creep_1.RETURN_CODE_DECODER[result.toString()].replace("ERR_", ""));
                        console.log(creep.name, creep.saying);
                        break;
                }
            })
                .run();
        }
    }
    else {
        const targetRoom = Game.rooms[memory.targetRoomName];
        if (!targetRoom) {
            return (0, util_creep_1.moveRoom)(creep, creep.pos.roomName, memory.targetRoomName);
        }
        if (!creep.memory.storeId || (((_e = Game.getObjectById(creep.memory.storeId)) === null || _e === void 0 ? void 0 : _e.store.energy) || 0) === 0) {
            creep.memory.storeId = undefined;
        }
        if (!memory.storeId) {
            const containers = targetRoom.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_CONTAINER,
            });
            const searched = PathFinder.search(creep.pos, _(containers)
                .thru((all) => {
                const hasE = all.filter((c) => c.store.energy);
                if (hasE.length) {
                    return hasE;
                }
                else {
                    return all;
                }
            })
                .map((t) => t.pos)
                .value(), { plainCost: 2, swampCost: 3 });
            if (!searched.incomplete && searched.path.length > 0) {
                creep.memory.storeId = (_f = _(searched.path).last().findClosestByRange(containers)) === null || _f === void 0 ? void 0 : _f.id;
            }
            else {
                return (0, util_creep_1.moveRoom)(creep, creep.pos.roomName, memory.targetRoomName);
            }
        }
        const store = memory.storeId && Game.getObjectById(memory.storeId);
        if (store) {
            _(creep.withdraw(store, RESOURCE_ENERGY))
                .tap((result) => {
                switch (result) {
                    case OK:
                        break;
                    case ERR_NOT_IN_RANGE:
                        moveMeTo(store);
                        break;
                    default:
                        creep.say(util_creep_1.RETURN_CODE_DECODER[result.toString()].replace("ERR_", ""));
                        console.log(creep.name, creep.saying);
                        break;
                }
            })
                .run();
        }
    }
    if (creep.memory.mode === "🚛" &&
        creep.pos.roomName !== creep.memory.baseRoom &&
        (0, utils_1.getSitesInRoom)(creep.room).length === 0 &&
        !(0, utils_1.isHighway)(creep.room) &&
        !creep.pos.lookFor(LOOK_STRUCTURES).find((s) => s.structureType === STRUCTURE_ROAD)) {
        creep.pos.createConstructionSite(STRUCTURE_ROAD);
    }
    (0, util_creep_1.pickUpAll)(creep);
};
exports.default = behavior;
function isRemoteCarrier(creep) {
    return creep.memory.role === "remoteCarrier";
}
