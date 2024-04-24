"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomBehavior = void 0;
const util_creep_1 = require("./util.creep");
function roomBehavior(room) {
    // Roomとしてやっておくこと
    // 今使えるソース
    room.memory.activeSource = findActiceSource(room);
    // 建築が終わった対象を消しておく
    room.memory.priorityConstructionTarget =
        room.memory.priorityConstructionTarget.filter((id) => Game.getObjectById(id));
    if (!room.memory.roadLayed || Game.time - room.memory.roadLayed > 5000) {
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
    _((0, util_creep_1.getSpawnNamesInRoom)(room))
        .map((name) => Game.spawns[name])
        .compact()
        .forEach((spawn) => {
        const findCustomPath = (s) => spawn.pos.findPathTo(s, {
            ignoreCreeps: true,
            plainCost: 1.1, // 道よりいくらか高い
            swampCost: 1.1, // これから道を引くのでplainと同じ
            costCallback(roomName, costMatrix) {
                const room = Game.rooms[roomName];
                _.range(50).forEach((x) => {
                    _.range(50).forEach((y) => {
                        const pos = room.getPositionAt(x, y);
                        if (!pos) {
                            return;
                        }
                        else if (pos
                            .look()
                            .some((s) => "structureType" in s &&
                            s.structureType === STRUCTURE_ROAD)) {
                            // 道がある or 道を引く場合道と同じ値にする
                            costMatrix.set(x, y, 1);
                        }
                    });
                });
            },
        });
        return (_([
            ...room.find(FIND_SOURCES),
            ...room.find(FIND_MY_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_CONTROLLER,
            }),
        ])
            // 近い順にする
            .sortBy((s) => findCustomPath(s).length)
            .map((s) => {
            return findCustomPath(s).map((path) => {
                var _a;
                const returnVal = room.createConstructionSite(path.x, path.y, STRUCTURE_ROAD);
                if (returnVal === OK) {
                    const site = _.first(((_a = room
                        .getPositionAt(path.x, path.y)) === null || _a === void 0 ? void 0 : _a.lookFor(LOOK_CONSTRUCTION_SITES)) || []);
                    if (site) {
                        room.memory.priorityConstructionTarget.push(site.id);
                    }
                }
            });
        })
            .run());
    })
        .run();
    room.memory.roadLayed = Game.time;
}
