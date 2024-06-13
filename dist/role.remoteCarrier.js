"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (creep) => {
    var _a, _b, _c, _d;
    if (!isRemoteCarrier(creep)) {
        return console.log(`${creep.name} is not RemoteCarrier`);
    }
    const moveMeTo = (target, opt) => {
        return (0, util_creep_1.customMove)(creep, target, Object.assign({}, opt));
    };
    const memory = (0, utils_1.readonly)(creep.memory);
    const preMode = memory.mode;
    if (creep.store.energy < CARRY_CAPACITY) {
        creep.memory.mode = "🛒";
    }
    else if (creep.room.name !== memory.baseRoom && (0, utils_1.getSitesInRoom)(creep.room).length > 0) {
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
                const { container, link, storage, terminal } = (0, utils_1.findMyStructures)(baseRoom);
                const targets = [
                    ...container.filter((c) => {
                        return baseRoom.find(FIND_MINERALS).some((m) => !c.pos.inRangeTo(m, 3));
                    }),
                    ...link,
                    ...storage,
                    ...terminal,
                ].filter((s) => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                const searched = PathFinder.search(creep.pos, targets.map((t) => t.pos), { plainCost: 2, swampCost: 10 });
                if (!searched.incomplete && searched.path.length > 0) {
                    const target = targets.find((t) => {
                        const goal = _(searched.path).last();
                        return t.pos.x === (goal === null || goal === void 0 ? void 0 : goal.x) && t.pos.y === goal.y && goal.roomName === t.pos.roomName;
                    });
                    creep.memory.transferId = target === null || target === void 0 ? void 0 : target.id;
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
        const sites = (0, utils_1.getSitesInRoom)(creep.room);
        if (memory.siteId && !Game.getObjectById(memory.siteId)) {
            creep.memory.siteId = undefined;
        }
        if (!memory.siteId) {
            creep.memory.siteId = (_c = creep.pos.findClosestByPath(sites)) === null || _c === void 0 ? void 0 : _c.id;
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
        if (creep.memory.storeId && (((_d = Game.getObjectById(creep.memory.storeId)) === null || _d === void 0 ? void 0 : _d.store.energy) || 0) === 0) {
            creep.memory.storeId = undefined;
        }
        if (!memory.storeId) {
            const containers = targetRoom.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store.energy > 0,
            });
            const searched = PathFinder.search(creep.pos, containers.map((t) => t.pos), { plainCost: 2, swampCost: 10 });
            if (!searched.incomplete && searched.path.length > 0) {
                const target = containers.find((c) => {
                    const goal = _(searched.path).last();
                    return c.pos.x === (goal === null || goal === void 0 ? void 0 : goal.x) && c.pos.y === goal.y && goal.roomName === c.pos.roomName;
                });
                creep.memory.storeId = target === null || target === void 0 ? void 0 : target.id;
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
        if (creep.memory.mode === "🚛" &&
            creep.pos.roomName !== creep.memory.baseRoom &&
            (0, utils_1.getSitesInRoom)(creep.room).length === 0 &&
            !(0, utils_1.isHighway)(creep.room) &&
            !creep.pos.lookFor(LOOK_STRUCTURES).find((s) => s.structureType === STRUCTURE_ROAD)) {
            creep.pos.createConstructionSite(STRUCTURE_ROAD);
        }
        (0, util_creep_1.pickUpAll)(creep);
    }
};
exports.default = behavior;
function isRemoteCarrier(creep) {
    return creep.memory.role === "remoteCarrier";
}
