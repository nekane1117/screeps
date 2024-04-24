"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const roles_1 = require("./roles");
const role_room_1 = require("./role.room");
const role_spawn_1 = __importDefault(require("./role.spawn"));
const structure_container_1 = require("./structure.container");
module.exports.loop = function () {
    //死んだcreepは削除する
    Object.keys(Memory.creeps || {}).forEach((name) => {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log("Clearing non-existing creep memory:", name);
        }
    });
    // Room -> Spawn -> Container -> Creep
    const spawnGroup = _.groupBy(Object.values(Game.spawns), (c) => c.room.name);
    const creepGroup = _.groupBy(Object.values(Game.creeps), (c) => c.room.name);
    Object.entries(Game.rooms).forEach(([_roomName, room]) => {
        var _a, _b;
        (0, role_room_1.roomBehavior)(room);
        (_a = spawnGroup[room.name]) === null || _a === void 0 ? void 0 : _a.map(role_spawn_1.default);
        Object.keys(room.memory.containers).forEach((id) => (0, structure_container_1.containerBehavior)(id));
        (_b = creepGroup[room.name]) === null || _b === void 0 ? void 0 : _b.map((c) => { var _a; return !c.spawning && ((_a = roles_1.behaviors[c.memory.role]) === null || _a === void 0 ? void 0 : _a.call(roles_1.behaviors, c)); });
    });
};
