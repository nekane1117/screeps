"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const behavior = (road) => {
    if (Game.time % 1000) {
        return;
    }
    if (!isR(road)) {
        return console.log("type is invalid", road);
    }
    const { room: { memory: { roadMap }, }, pos, } = road;
    const border = 1000;
    const current = Game.time - roadMap[pos.y * 50 + pos.x];
    if (border < current) {
        road.destroy();
    }
};
exports.default = behavior;
function isR(s) {
    return s.structureType === STRUCTURE_ROAD;
}
