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
            const rampartInRange = target.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_RAMPART && s.my && target.pos.inRangeTo(s, 3),
            });
            if (rampartInRange) {
                moveMeTo(rampartInRange);
            }
            else if (!creep.pos.inRangeTo(target, 3)) {
                moveMeTo(target, { range: 3 });
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
            _(creep.pos.findInRange(FIND_MY_CREEPS, 3))
                .tap((creeps) => {
                const target = _(creeps).min((c) => c.hits);
                if (target) {
                    if (creep.pos.isNearTo(target)) {
                        creep.heal(target);
                    }
                    else {
                        creep.rangedHeal(target);
                    }
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
