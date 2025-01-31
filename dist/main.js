"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const room_1 = require("./room");
const structures_1 = __importDefault(require("./structures"));
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
module.exports.loop = function () {
    console.log(`start ${Game.time}`);
    if (Game.cpu.bucket > 200) {
        Memory.do = true;
    }
    else if (Game.cpu.bucket < 100) {
        Memory.do = false;
    }
    if (!Memory.do) {
        console.log(`end bucket不足(${Game.cpu.bucket}) usage : ${Game.cpu.getUsed()}`);
        return;
    }
    (0, utils_1.logUsage)("all", () => {
        if (Game.cpu.bucket === 10000) {
            Game.cpu.generatePixel();
        }
        (0, utils_1.logUsage)("delete creep memoery", () => {
            Object.keys(Memory.creeps).forEach((name) => {
                if (!Game.creeps[name]) {
                    delete Memory.creeps[name];
                    console.log("Clearing non-existing creep memory:", name);
                }
            });
        });
        (0, utils_1.logUsage)("delete rooms memoery", () => {
            Object.keys(Memory.rooms).forEach((name) => {
                var _a, _b;
                if (!((_b = (_a = Game.rooms[name]) === null || _a === void 0 ? void 0 : _a.controller) === null || _b === void 0 ? void 0 : _b.my)) {
                    delete Memory.rooms[name];
                }
            });
        });
        (0, utils_1.logUsage)("delete room find memoery", () => {
            Object.values(Memory.rooms).forEach((mem) => {
                delete mem.find;
            });
        });
        if (Game.cpu.bucket < 100) {
            console.log(`bucket不足 :(${Game.cpu.bucket})`);
            return;
        }
        (0, utils_1.logUsage)("flags", () => {
            Object.values(Game.flags).forEach((flag) => { var _a, _b; return (_b = (_a = require("./flags"))[flag.color]) === null || _b === void 0 ? void 0 : _b.call(_a, flag); });
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
            Object.values(Game.creeps).forEach((c) => {
                var _a, _b;
                if (c.spawning) {
                    return;
                }
                c.memory.moved = undefined;
                c.room.visual.text(c.name.split("_")[0], c.pos.x, c.pos.y, {
                    color: (0, util_creep_1.toColor)(c),
                });
                (_b = (_a = require("./roles").behaviors)[c.memory.role]) === null || _b === void 0 ? void 0 : _b.call(_a, c);
                c.getActiveBodyparts(WORK) &&
                    c.pos
                        .lookFor(LOOK_STRUCTURES)
                        .filter((s) => [STRUCTURE_CONTAINER, STRUCTURE_ROAD].includes(s.structureType) && s.hits < s.hitsMax)
                        .forEach((s) => c.repair(s));
                c.memory.moved === OK && c.room.memory.roadMap && c.room.memory.roadMap[c.pos.y * 50 + c.pos.x]++;
                c.memory.moved === OK && (c.memory.__avoidCreep = false);
            });
        });
        (0, utils_1.logUsage)("constructionSites", () => {
            Object.values(Game.constructionSites).forEach((site) => {
                var _a, _b, _c;
                if (((_a = site.room) === null || _a === void 0 ? void 0 : _a.name) && Memory.rooms[(_b = site.room) === null || _b === void 0 ? void 0 : _b.name]) {
                    const { builder: builders = [] } = (0, util_creep_1.getCreepsInRoom)(site.room);
                    if (builders.length > 2) {
                        _(builders)
                            .sortBy((b) => -(b.ticksToLive || 0))
                            .forEach((b, i) => {
                            if (i !== 0) {
                                b.suicide();
                            }
                        })
                            .run();
                    }
                    if (builders.length === 0) {
                        const spawn = (_c = _(Object.values(Game.spawns))
                            .map((spawn) => {
                            return {
                                spawn,
                                cost: PathFinder.search(site.pos, spawn.pos).cost,
                            };
                        })
                            .min((v) => v.cost)) === null || _c === void 0 ? void 0 : _c.spawn;
                        if (spawn) {
                            spawn.spawnCreep((0, util_creep_1.filterBodiesByCost)("builder", spawn.room.energyCapacityAvailable).bodies, `B_${site.room.name}_${Game.time}`, {
                                memory: {
                                    mode: "🛒",
                                    baseRoom: site.room.name,
                                    role: "builder",
                                },
                            });
                        }
                    }
                }
            });
        });
    });
    console.log(`end ${Game.time}`);
};
