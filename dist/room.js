"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const source_1 = __importDefault(require("./source"));
function behavior(room) {
    if (!room.memory.sources || Game.time % 500) {
        const terrain = room.getTerrain();
        room.memory.sources = room.find(FIND_SOURCES).reduce((sources, s) => {
            return Object.assign(Object.assign({}, sources), { [s.id]: {
                    spaces: (0, constants_1.getNeighborhoods)(s)
                        .map((p) => (terrain.get(p.x, p.y) !== TERRAIN_MASK_WALL ? 1 : 0))
                        .sum(),
                } });
        }, {});
    }
    _((0, utils_1.ObjectKeys)(room.memory.sources))
        .map((s) => Game.getObjectById(s))
        .compact()
        .map(source_1.default)
        .run();
}
exports.default = behavior;
