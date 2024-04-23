"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomBehavior = void 0;
const util_creep_1 = require("./util.creep");
function roomBehavior(room) {
    // Roomとしてやっておくこと
    // 今使えるソース
    room.memory.activeSource = findActiceSource(room);
    if (!room.memory.roadLayed ||
        Game.time - room.memory.roadLayed > (room.name === "sim" ? 100 : 5000)) {
        console.log("roadLayer in " + Game.time);
        roadLayer(room);
    }
    // エクステンション建てる
    creteExtensions(room);
}
exports.roomBehavior = roomBehavior;
/** 今使えるソース */
function findActiceSource(room) {
    return _(room.find(FIND_SOURCES_ACTIVE, {
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
        .map((s) => s.id)
        .value();
}
/** エクステンション建てる */
function creteExtensions(room) {
    var _a;
    const spawn = (_a = Object.entries(Game.spawns).find(([_, s]) => s.room.name === room.name)) === null || _a === void 0 ? void 0 : _a[1];
    if (room.controller && spawn) {
        const extensions = [
            ...room.find(FIND_MY_CONSTRUCTION_SITES),
            ...room.find(FIND_MY_STRUCTURES),
        ].filter((s) => s.structureType === STRUCTURE_EXTENSION);
        if (extensions.length <
            CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][room.controller.level]) {
            for (const dist of _.range(1, 25)) {
                for (const dy of _.range(-dist, dist + 1)) {
                    for (const dx of _.range(-dist, dist + 1)) {
                        if (Math.abs(dx) + Math.abs(dy) === dist && (dx + dy) % 2 === 0) {
                            if (room.createConstructionSite(spawn.pos.x + dx, spawn.pos.y + dy, STRUCTURE_EXTENSION) === OK) {
                                // つくれた場合抜ける
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
}
// 全てのspawnからsourceまでの道を引く
function roadLayer(room) {
    _((0, util_creep_1.getSpawnNamesInRoom)(room).map((name) => Game.spawns[name]))
        .compact()
        .value()
        .forEach((spawn) => {
        return room.find(FIND_SOURCES).forEach((source) => {
            room
                .findPath(spawn.pos, source.pos, {
                ignoreCreeps: true,
                swampCost: 1,
            })
                .map((path) => {
                // そこに道が無ければ敷く
                const pos = room.getPositionAt(path.x, path.y);
                return (!(pos === null || pos === void 0 ? void 0 : pos.lookFor(LOOK_TERRAIN).some((t) => t === "wall")) &&
                    !(pos === null || pos === void 0 ? void 0 : pos.lookFor(LOOK_STRUCTURES).some((s) => s.structureType === STRUCTURE_ROAD)) &&
                    room.createConstructionSite(path.x, path.y, STRUCTURE_ROAD));
            });
        });
    });
    room.memory.roadLayed = Game.time;
}
