"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomBehavior = void 0;
const util_creep_1 = require("./util.creep");
function roomBehavior(room) {
    // Roomとしてやっておくこと
    room.memory.activeSource = _(room.find(FIND_SOURCES_ACTIVE, {
        filter: (s) => {
            return !!_(util_creep_1.squareDiff)
                // 8近傍の位置を取得する
                .map(([dx, dy]) => {
                return room.getPositionAt(s.pos.x + dx, s.pos.y + dy);
            })
                .compact()
                // 壁以外かつcreepのいないマス
                .filter((pos) => pos.lookFor(LOOK_TERRAIN)[0] !== "wall" &&
                !pos.lookFor(LOOK_CREEPS).length)
                // がある
                .size();
        },
    }))
        .sortBy((source) => {
        const spawn = Object.entries(Game.spawns).find(([_, spawn]) => spawn.room.name === room.name);
        if (spawn) {
            return spawn[1].pos.findPathTo(source).length;
        }
        else {
            return 0;
        }
    })
        .map((s) => s.id)
        .value();
}
exports.roomBehavior = roomBehavior;
