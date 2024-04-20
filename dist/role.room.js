"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomBehavior = void 0;
const util_creep_1 = require("./util.creep");
function roomBehavior(room) {
    // Roomとしてやっておくこと
    room.memory.activeSource = room.find(FIND_SOURCES_ACTIVE, {
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
    }).map(s => s.id);
}
exports.roomBehavior = roomBehavior;
