"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function behavior(road) {
    if (!isR(road)) {
        return console.log("type is invalid", JSON.stringify(road));
    }
    if (road.hits < road.hitsMax) {
        road.room.visual.text("x", road.pos, {
            opacity: _.ceil(1 - road.hits / road.hitsMax, 1),
        });
    }
    return OK;
}
exports.default = behavior;
function isR(s) {
    return s.structureType === STRUCTURE_ROAD;
}
