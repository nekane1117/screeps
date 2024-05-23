"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constructionSite_1 = __importDefault(require("./constructionSite"));
const flags_1 = __importDefault(require("./flags"));
const roles_1 = require("./roles");
const room_1 = require("./room");
const structures_1 = __importDefault(require("./structures"));
const utils_1 = require("./utils");
module.exports.loop = function () {
    (0, utils_1.logUsage)("all", () => {
        (0, utils_1.logUsage)("remov", () => {
            if (Game.time % 100 === 0) {
                Object.keys(Memory.creeps).forEach((name) => {
                    if (!Game.creeps[name]) {
                        delete Memory.creeps[name];
                        console.log("Clearing non-existing creep memory:", name);
                    }
                });
            }
        });
        (0, utils_1.logUsage)("flags", () => {
            Object.values(Game.flags).forEach((flag) => { var _a; return (_a = flags_1.default[flag.color]) === null || _a === void 0 ? void 0 : _a.call(flags_1.default, flag); });
        });
        (0, utils_1.logUsage)("sites", () => {
            if (Game.cpu.bucket > 20) {
                const executedRoom = {};
                Object.values(Game.constructionSites).forEach((s) => {
                    if (executedRoom[s.pos.roomName]) {
                        return;
                    }
                    else {
                        (0, constructionSite_1.default)(s);
                        executedRoom[s.pos.roomName] = true;
                    }
                });
            }
            else {
                console.log("cpu bucket is shrotage");
            }
        });
        (0, utils_1.logUsage)("rooms", () => {
            Object.values(Game.rooms).forEach((room) => {
                (0, room_1.roomBehavior)(room);
                (0, utils_1.findMyStructures)(room).all.forEach((s) => { var _a; return (_a = structures_1.default[s.structureType]) === null || _a === void 0 ? void 0 : _a.call(structures_1.default, s); });
            });
        });
        (0, utils_1.logUsage)("creep", () => {
            Object.values(Game.creeps).forEach((c) => {
                var _a;
                if (c.spawning) {
                    return;
                }
                c.memory.moved = undefined;
                c.room.visual.text(c.name[0], c.pos.x, c.pos.y, {
                    color: `#${c.id.slice(-6)}`,
                });
                (_a = roles_1.behaviors[c.memory.role]) === null || _a === void 0 ? void 0 : _a.call(roles_1.behaviors, c);
            });
        });
    });
};
