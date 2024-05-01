"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const room_1 = __importDefault(require("./room"));
const roles_1 = __importDefault(require("./roles"));
module.exports.loop = function () {
    if (Game.time % 100 === 0 && Game.cpu.bucket == 10000) {
        Game.cpu.generatePixel();
    }
    (0, utils_1.ObjectKeys)(Memory.creeps || {}).forEach((name) => {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log("Clearing non-existing creep memory:", name);
        }
    });
    (0, utils_1.ObjectKeys)(Memory.rooms || {}).forEach((name) => {
        if (!Game.rooms[name]) {
            delete Memory.rooms[name];
            console.log("Clearing non-existing rooms memory:", name);
        }
    });
    Object.values(Game.rooms).map(room_1.default);
    Object.values(Game.creeps).map((c) => { var _a; return (_a = roles_1.default[c.memory.role]) === null || _a === void 0 ? void 0 : _a.call(roles_1.default, c); });
};
