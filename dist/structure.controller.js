"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (controller) => {
    if (!isC(controller)) {
        return console.log("type is invalid", controller);
    }
    controller.room.visual.text(`bucket  : ${Game.cpu.bucket.toLocaleString()}`, controller.pos.x, controller.pos.y - 2);
    controller.room.visual.text(`progress:${(controller.progressTotal - controller.progress).toLocaleString()}`, controller.pos.x, controller.pos.y - 1);
    const upgrader = Object.values(Game.creeps).filter((c) => {
        return c.memory.role === "upgrader" && c.memory.baseRoom === controller.pos.roomName;
    });
    if (!upgrader.length) {
        const spawn = (0, utils_1.getSpawnsOrderdByRange)(controller, 1).first();
        if (spawn && spawn.room.energyAvailable >= 300) {
            spawn.spawnCreep((0, util_creep_1.filterBodiesByCost)("upgrader", spawn.room.energyAvailable).bodies, `U_${controller.room.name}_${Game.time}`, {
                memory: {
                    baseRoom: controller.room.name,
                    mode: "🛒",
                    role: "upgrader",
                },
            });
        }
        else {
            console.log("controller can't find spawn");
        }
    }
};
exports.default = behavior;
function isC(s) {
    return s.structureType === STRUCTURE_CONTROLLER;
}
