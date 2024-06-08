"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (creep) => {
    var _a, _b;
    if (!isReserver(creep)) {
        return console.log(`${creep.name} is not Builder`);
    }
    const moveMeTo = (target, opt) => (0, util_creep_1.customMove)(creep, target, opt);
    const memory = (0, utils_1.readonly)(creep.memory);
    const targetRoom = Game.rooms[memory.targetRoomName];
    if (targetRoom) {
        const hostiles = [...targetRoom.find(FIND_HOSTILE_CREEPS), ...targetRoom.find(FIND_HOSTILE_SPAWNS), ...targetRoom.find(FIND_HOSTILE_STRUCTURES)];
        if (hostiles.length > 0 && creep.getActiveBodyparts(ATTACK)) {
            const target = creep.pos.findClosestByRange(hostiles);
            if (target) {
                moveMeTo(target, {
                    range: !("body" in target) || target.getActiveBodyparts(ATTACK) === 0 ? 0 : 3,
                });
                creep.rangedAttack(target);
                creep.attack(target);
            }
        }
        else {
            if (targetRoom.controller) {
                if (!creep.pos.isNearTo(targetRoom.controller)) {
                    moveMeTo(targetRoom.controller);
                }
                if (((_a = targetRoom.controller.reservation) === null || _a === void 0 ? void 0 : _a.username) !== "Nekane") {
                    creep.attackController(targetRoom.controller);
                }
                creep.reserveController(targetRoom.controller);
            }
        }
    }
    else {
        const route = memory.route ||
            (creep.memory.route = Game.map.findRoute(creep.pos.roomName, memory.targetRoomName, {
                routeCallback(roomName) {
                    var _a;
                    const parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
                    const isHighway = parsed && (Number(parsed[1]) % 10 === 0 || Number(parsed[2]) % 10 === 0);
                    const room = Game.rooms[roomName];
                    const isMyRoom = (_a = room === null || room === void 0 ? void 0 : room.controller) === null || _a === void 0 ? void 0 : _a.my;
                    if (isHighway || isMyRoom) {
                        return 1;
                    }
                    else {
                        return 2.5;
                    }
                },
            }));
        if (!Array.isArray(route)) {
            console.log("route not found", JSON.stringify(route));
            creep.memory.route = undefined;
            return;
        }
        const current = route[route.findIndex((r) => r.room === creep.pos.roomName) + 1];
        if (!current) {
            creep.memory.route = undefined;
            return;
        }
        if (((_b = memory.exit) === null || _b === void 0 ? void 0 : _b.roomName) !== creep.pos.roomName) {
            creep.memory.exit = creep.pos.findClosestByPath(current.exit);
        }
        const moved = creep.memory.exit && moveMeTo(new RoomPosition(creep.memory.exit.x, creep.memory.exit.y, creep.memory.exit.roomName));
        if (moved !== OK) {
            const code = moved ? util_creep_1.RETURN_CODE_DECODER[moved.toString()] : "no exit";
            console.log(`${creep.name}:${code}:${JSON.stringify(creep.memory.exit)}`);
            creep.say(code.replace("ERR_", ""));
            creep.memory.route = undefined;
            creep.memory.exit = undefined;
        }
    }
};
exports.default = behavior;
function isReserver(creep) {
    return creep.memory.role === "reserver";
}
