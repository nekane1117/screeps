"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const behavior = (creep) => {
    var _a, _b;
    const moveMeTo = (target, opt) => (0, util_creep_1.customMove)(creep, target, Object.assign({ ignoreCreeps: !creep.pos.inRangeTo(target, 2) }, opt));
    if (!isD(creep)) {
        return console.log(`${creep.name} is not MineralCarrier`);
    }
    if (creep.room.name !== creep.memory.baseRoom) {
        const controller = (_a = Game.rooms[creep.memory.baseRoom]) === null || _a === void 0 ? void 0 : _a.controller;
        return controller && moveMeTo(controller);
    }
    if (creep.memory.targetId || (creep.memory.targetId = (_b = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS)) === null || _b === void 0 ? void 0 : _b.id)) {
        const target = Game.getObjectById(creep.memory.targetId);
        if (target) {
            if (!creep.pos.isNearTo(target)) {
                moveMeTo(target);
            }
            _(creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3))
                .tap((hostiles) => {
                if (hostiles.length === 0) {
                    return;
                }
                else if (hostiles.length === 1) {
                    const hostile = hostiles[0];
                    creep.rangedAttack(hostiles[0]);
                    if (creep.pos.isNearTo(hostile)) {
                        creep.attack(hostile);
                    }
                }
                else {
                    creep.rangedMassAttack();
                }
            })
                .run();
        }
        else {
            creep.memory.targetId = undefined;
            return ERR_NOT_FOUND;
        }
    }
    else {
        const spawn = (0, util_creep_1.getMainSpawn)(creep.room);
        if (spawn) {
            if (spawn.recycleCreep(creep) === ERR_NOT_IN_RANGE) {
                moveMeTo(spawn);
            }
        }
        else {
            creep.suicide();
        }
    }
};
exports.default = behavior;
function isD(creep) {
    return creep.memory.role === "defender";
}
