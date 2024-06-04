"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (creep) => {
    var _a, _b, _c;
    if (!isReserver(creep)) {
        return console.log(`${creep.name} is not Builder`);
    }
    const moveMeTo = (target) => (0, util_creep_1.customMove)(creep, target, {
        ignoreCreeps: !creep.pos.inRangeTo(target, 2),
    });
    const memory = (0, utils_1.readonly)(creep.memory);
    if (creep.pos.roomName === memory.targetRoomName) {
        if ((_a = creep.room.controller) === null || _a === void 0 ? void 0 : _a.my) {
            return creep.say("reserved");
        }
        if (creep.room.controller) {
            if (((_b = creep.room.controller.reservation) === null || _b === void 0 ? void 0 : _b.username) !== "Nekane") {
                _(creep.attackController(creep.room.controller))
                    .tap((reserve) => {
                    switch (reserve) {
                        case ERR_NOT_IN_RANGE:
                            return creep.room.controller && moveMeTo(creep.room.controller);
                        case OK:
                        case ERR_INVALID_TARGET:
                            return;
                        default:
                            return console.log("attackController", util_creep_1.RETURN_CODE_DECODER[reserve.toString()]);
                    }
                })
                    .run();
            }
            _(creep.reserveController(creep.room.controller))
                .tap((reserve) => {
                switch (reserve) {
                    case ERR_NOT_IN_RANGE:
                        return creep.room.controller && moveMeTo(creep.room.controller);
                    case OK:
                        return;
                    default:
                        return console.log("reserveController", util_creep_1.RETURN_CODE_DECODER[reserve.toString()]);
                }
            })
                .run();
        }
    }
    else {
        const route = memory.route ||
            (creep.memory.route = Game.map.findRoute(creep.pos.roomName, memory.targetRoomName, {
                routeCallback(roomName) {
                    var _a;
                    const parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
                    const isHighway = parsed && (Number(parsed[1]) % 10 === 0 || Number(parsed[2]) % 10 === 0);
                    const isMyRoom = Game.rooms[roomName] && Game.rooms[roomName].controller && ((_a = Game.rooms[roomName].controller) === null || _a === void 0 ? void 0 : _a.my);
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
        if (((_c = memory.exit) === null || _c === void 0 ? void 0 : _c.roomName) !== creep.pos.roomName) {
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
