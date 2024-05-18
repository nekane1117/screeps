"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const behavior = (claimer) => {
    var _a, _b, _c;
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
    const target = ((_a = flag.room) === null || _a === void 0 ? void 0 : _a.controller) || flag;
    if (((_b = target.room) === null || _b === void 0 ? void 0 : _b.name) === claimer.room.name && "structureType" in target) {
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
    console.log(util_creep_1.RETURN_CODE_DECODER[moveMeTo(((_c = flag.room) === null || _c === void 0 ? void 0 : _c.controller) || flag).toString()]);
};
exports.default = behavior;
function isClaimer(creep) {
    return creep.memory.role === "claimer";
}
