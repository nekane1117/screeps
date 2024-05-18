"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const flags_1 = __importDefault(require("./flags"));
const role_room_1 = require("./role.room");
const role_spawn_1 = __importDefault(require("./role.spawn"));
const roles_1 = require("./roles");
const structures_1 = __importDefault(require("./structures"));
const utils_1 = require("./utils");
module.exports.loop = function () {
    if (Game.cpu.bucket === 10000) {
        Game.cpu.generatePixel();
    }
    Object.keys(Memory.creeps || {}).forEach((name) => {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log("Clearing non-existing creep memory:", name);
        }
    });
    Object.keys(Memory.rooms || {}).forEach((name) => {
        if (!Game.rooms[name]) {
            delete Memory.rooms[name];
            console.log("Clearing non-existing rooms memory:", name);
        }
    });
    Memory.sources = Memory.sources || {};
    Object.values(Game.flags).map((f) => { var _a; return (_a = flags_1.default[f.color]) === null || _a === void 0 ? void 0 : _a.call(flags_1.default, f); });
    const spawnGroup = _.groupBy(Object.values(Game.spawns), (c) => c.room.name);
    const creepGroup = _.groupBy(Object.values(Game.creeps), (c) => c.room.name);
    Object.entries(Game.rooms).forEach(([_roomName, room]) => {
        var _a, _b;
        (0, role_room_1.roomBehavior)(room);
        (_a = spawnGroup[room.name]) === null || _a === void 0 ? void 0 : _a.map(role_spawn_1.default);
        (0, utils_1.findMyStructures)(room).all.map((s) => { var _a; return (_a = structures_1.default[s.structureType]) === null || _a === void 0 ? void 0 : _a.call(structures_1.default, s); });
        (_b = creepGroup[room.name]) === null || _b === void 0 ? void 0 : _b.map((c) => {
            var _a;
            if (c.spawning) {
                return;
            }
            c.memory.moved = undefined;
            return (_a = roles_1.behaviors[c.memory.role]) === null || _a === void 0 ? void 0 : _a.call(roles_1.behaviors, c);
        });
    });
};
