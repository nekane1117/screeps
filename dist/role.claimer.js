"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (claimer) => {
    var _a, _b, _c, _d;
    if (!isClaimer(claimer)) {
        return console.log(`${claimer.name} is not Builder`);
    }
    const moveMeTo = (target) => (0, util_creep_1.customMove)(claimer, target, {
        ignoreCreeps: !claimer.pos.inRangeTo(target, 2),
    });
    const flag = Game.flags[claimer.memory.flagName];
    if (!flag) {
        claimer.suicide();
    }
    if ((((_b = (_a = flag.room) === null || _a === void 0 ? void 0 : _a.controller) === null || _b === void 0 ? void 0 : _b.level) || 0) > 0) {
        const spawn = (0, utils_1.getSpawnsOrderdByRange)(flag).first();
        if (spawn) {
            const recycle = spawn.recycleCreep(claimer);
            if (recycle === OK) {
                return recycle;
            }
            else if (recycle === ERR_NOT_IN_RANGE) {
                return moveMeTo(spawn);
            }
        }
        else {
            return ERR_NOT_FOUND;
        }
    }
    const target = ((_c = flag.room) === null || _c === void 0 ? void 0 : _c.controller) || flag;
    if (((_d = target.room) === null || _d === void 0 ? void 0 : _d.name) === claimer.room.name && "structureType" in target) {
        const claimed = claimer.claimController(target);
        switch (claimed) {
            case ERR_NOT_IN_RANGE:
                moveMeTo(target);
                break;
            case OK:
                break;
            default:
                console.log(util_creep_1.RETURN_CODE_DECODER[claimed.toString()]);
                break;
        }
    }
    else {
        moveMeTo(target);
    }
};
exports.default = behavior;
function isClaimer(creep) {
    return creep.memory.role === "claimer";
}
