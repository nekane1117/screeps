"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const behavior = (claimer) => {
    if (!isClaimer(claimer)) {
        return console.log(`${claimer.name} is not Builder`);
    }
    claimer;
};
exports.default = behavior;
function isClaimer(creep) {
    return creep.memory.role === "claimer";
}
