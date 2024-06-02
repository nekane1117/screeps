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
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
module.exports.loop = function () {
    (0, utils_1.logUsage)("all", () => {
        if (Game.cpu.bucket === 10000) {
            Game.cpu.generatePixel();
        }
        (0, utils_1.logUsage)("delete memoery", () => {
            if (Object.keys(Game.creeps).length !== Object.keys(Memory.creeps).length) {
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
        });
        (0, utils_1.logUsage)("rooms", () => {
            Object.values(Game.rooms)
                .filter((room) => { var _a; return !(0, utils_1.isHighway)(room) && ((_a = room.controller) === null || _a === void 0 ? void 0 : _a.my); })
                .forEach((room) => {
                (0, room_1.roomBehavior)(room);
                (0, utils_1.findMyStructures)(room).all.forEach((s) => { var _a; return (_a = structures_1.default[s.structureType]) === null || _a === void 0 ? void 0 : _a.call(structures_1.default, s); });
            });
        });
        (0, utils_1.logUsage)("creep", () => {
            Object.values(Game.creeps)
                .sort((c1, c2) => {
                const getPriority = (creep) => {
                    switch (creep.memory.role) {
                        case "harvester":
                            return 0;
                        case "carrier":
                            return 1;
                        default:
                            return 2;
                    }
                };
                return getPriority(c1) - getPriority(c2);
            })
                .forEach((c) => {
                var _a;
                if (c.spawning) {
                    return;
                }
                c.memory.moved = undefined;
                c.room.visual.text(c.name.split("_")[0], c.pos.x, c.pos.y, {
                    color: (0, util_creep_1.toColor)(c),
                });
                (_a = roles_1.behaviors[c.memory.role]) === null || _a === void 0 ? void 0 : _a.call(roles_1.behaviors, c);
                c.getActiveBodyparts(WORK) &&
                    c.pos
                        .lookFor(LOOK_STRUCTURES)
                        .filter((s) => s.structureType === STRUCTURE_ROAD && s.hits < s.hitsMax)
                        .forEach((s) => c.repair(s));
                c.memory.__avoidCreep = Math.max(0, (c.memory.__avoidCreep || 0) - 1);
            });
        });
        Object.keys(Memory.rooms).forEach((name) => {
            var _a, _b;
            if (!((_b = (_a = Game.rooms[name]) === null || _a === void 0 ? void 0 : _a.controller) === null || _b === void 0 ? void 0 : _b.my)) {
                delete Memory.rooms[name];
            }
        });
        Object.values(Memory.rooms).forEach((mem) => {
            delete mem.find;
            delete mem.creeps;
        });
    });
};
