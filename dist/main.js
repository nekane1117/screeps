"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constructionSite_1 = __importDefault(require("./constructionSite"));
const room_1 = require("./room");
const roles_1 = require("./roles");
const structures_1 = __importDefault(require("./structures"));
const utils_1 = require("./utils");
module.exports.loop = function () {
    if (Game.cpu.bucket === 10000) {
        Game.cpu.generatePixel();
    }
    Object.keys(Memory.creeps).forEach((name) => {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log("Clearing non-existing creep memory:", name);
        }
    });
    Object.keys(Memory.rooms).forEach((name) => {
        if (!Game.rooms[name]) {
            delete Memory.rooms[name];
            console.log("Clearing non-existing rooms memory:", name);
        }
    });
    Object.values(Game.constructionSites).map(constructionSite_1.default);
    Object.values(Game.rooms).forEach((room) => {
        (0, room_1.roomBehavior)(room);
        (0, utils_1.findMyStructures)(room).all.map((s) => { var _a; return (_a = structures_1.default[s.structureType]) === null || _a === void 0 ? void 0 : _a.call(structures_1.default, s); });
    });
    Object.values(Game.creeps).map((c) => {
        var _a;
        if (c.spawning) {
            return;
        }
        c.memory.moved = undefined;
        c.room.visual.text(c.name[0], c.pos.x, c.pos.y, {
            color: `#${c.id.slice(-6)}`,
        });
        return (_a = roles_1.behaviors[c.memory.role]) === null || _a === void 0 ? void 0 : _a.call(roles_1.behaviors, c);
    });
};
