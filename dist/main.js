"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const room_1 = __importDefault(require("./room"));
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
};
