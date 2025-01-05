"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = behavior;
function behavior(flag) {
    flag.pos.lookFor(LOOK_STRUCTURES).forEach((s) => s.destroy());
    flag.remove();
}
