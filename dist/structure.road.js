"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const behavior = (road) => {
    if (!isR(road)) {
        return console.log("type is invalid", road);
    }
    const { room: { memory: { roadMap }, }, pos, } = road;
    const border = 2000;
    const current = Game.time - roadMap[pos.y * 50 + pos.x];
    const limit = border - current;
    if (limit < 100) {
        road.room.visual.text(`${limit}`, road.pos.x, road.pos.y, {
            opacity: limit / border,
        });
    }
    if (Game.time % 1000 && border < current) {
        road.destroy();
    }
};
exports.default = behavior;
function isR(s) {
    return s.structureType === STRUCTURE_ROAD;
}
