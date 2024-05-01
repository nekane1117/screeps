"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
function behavior(room) {
    if (!room.memory.sources || Game.time % 500) {
        const terrain = room.getTerrain();
        room.memory.sources = room.find(FIND_SOURCES).map((s) => {
            return {
                spaces: (0, constants_1.getNeighborhoods)(s)
                    .map((p) => (terrain.get(p.x, p.y) !== TERRAIN_MASK_WALL ? 1 : 0))
                    .sum(),
            };
        });
    }
}
exports.default = behavior;
