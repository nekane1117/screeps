"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomBehavior = void 0;
const util_creep_1 = require("./util.creep");
function roomBehavior(room) {
    var _a, _b;
    // Roomとしてやっておくこと
    if (room.find(FIND_HOSTILE_CREEPS).length && !((_a = room.controller) === null || _a === void 0 ? void 0 : _a.safeMode) && room.energyAvailable > SAFE_MODE_COST) {
        (_b = room.controller) === null || _b === void 0 ? void 0 : _b.activateSafeMode();
    }
    if (room.memory.harvesterLimit === undefined) {
        room.memory.harvesterLimit = getHarvesterLimit(room);
    }
    // 今使えるソース
    room.memory.activeSource = findActiceSource(room);
    if (!room.memory.roadLayed || Game.time - room.memory.roadLayed > 5000) {
        console.log("roadLayer in " + Game.time);
        roadLayer(room);
    }
    // エクステンション建てる
    creteStructures(room);
}
exports.roomBehavior = roomBehavior;
function getHarvesterLimit(room) {
    return _(room.find(FIND_SOURCES))
        .map((source) => {
        // 8近傍を取得
        const terrain = room.getTerrain();
        return _(util_creep_1.squareDiff)
            .map(([dx, dy]) => {
            return terrain.get(source.pos.x + dx, source.pos.y + dy) !== TERRAIN_MASK_WALL ? 1 : 0;
        })
            .run();
    })
        .flatten()
        .sum();
}
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
                .filter((pos) => pos.lookFor(LOOK_TERRAIN)[0] !== "wall" && !pos.lookFor(LOOK_CREEPS).length)
                // がある
                .size();
        },
    }))
        .map((s) => s.id)
        .value();
}
/** 部屋ごとの色々を建てる */
function creteStructures(room) {
    var _a;
    const spawn = (_a = Object.entries(Game.spawns).find(([_, s]) => s.room.name === room.name)) === null || _a === void 0 ? void 0 : _a[1];
    const targets = [STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_SPAWN];
    if (room.controller && spawn) {
        const terrain = room.getTerrain();
        for (const target of targets) {
            const extensions = [...room.find(FIND_MY_CONSTRUCTION_SITES), ...room.find(FIND_MY_STRUCTURES)].filter((s) => s.structureType === target);
            if (extensions.length < CONTROLLER_STRUCTURES[target][room.controller.level]) {
                for (const dist of _.range(1, 25)) {
                    for (const dy of _.range(-dist, dist + 1)) {
                        for (const dx of _.range(-dist, dist + 1)) {
                            if (Math.abs(dx) + Math.abs(dy) === dist &&
                                terrain.get(spawn.pos.x + dx, spawn.pos.y + dy) !== TERRAIN_MASK_WALL &&
                                room.createConstructionSite(spawn.pos.x + dx, spawn.pos.y + dy, (dx + dy) % 2 === 0 ? target : STRUCTURE_ROAD) === OK) {
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
            plainCost: 1, // 道よりいくらか低い
            swampCost: 1, // これから道を引くのでplainと同じ
            costCallback(roomName, costMatrix) {
                const room = Game.rooms[roomName];
                _.range(50).forEach((x) => {
                    _.range(50).forEach((y) => {
                        const pos = room.getPositionAt(x, y);
                        if (!pos) {
                            return;
                        }
                        else if (pos.look().some((s) => "structureType" in s && s.structureType === STRUCTURE_ROAD)) {
                            // 道がある or 道を引く場合道よりほんの少し高くする
                            costMatrix.set(x, y, 2);
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
                if (room.getTerrain().get(path.x, path.y) !== TERRAIN_MASK_WALL) {
                    room.createConstructionSite(path.x, path.y, STRUCTURE_ROAD);
                }
            });
        })
            .run());
    })
        .run();
    room.memory.roadLayed = Game.time;
}
