"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (controller) => {
    var _a;
    if (!isC(controller)) {
        return console.log("type is invalid", controller);
    }
    const showSummary = (texts) => {
        texts.forEach((text, i) => {
            controller.room.visual.text(text, Math.max(controller.pos.x - 3, 1), Math.max(1, controller.pos.y - texts.length + i), { align: "left" });
        });
    };
    showSummary([
        `energy  : ${controller.room.energyAvailable} / ${controller.room.energyCapacityAvailable}`,
        `bucket  : ${(_a = Game.cpu.bucket) === null || _a === void 0 ? void 0 : _a.toLocaleString()}`,
        `progress:${(controller.progressTotal - controller.progress).toLocaleString()}`,
    ]);
    const upgrader = Object.values(Game.creeps).filter((c) => {
        return c.memory.role === "upgrader" && c.memory.baseRoom === controller.pos.roomName;
    });
    const upgradeContainer = _(controller.pos.findInRange(FIND_STRUCTURES, 3, { filter: (s) => s.structureType === STRUCTURE_CONTAINER })).first();
    if (upgrader.length < (upgradeContainer ? (0, utils_1.getCapacityRate)(upgradeContainer) / 0.9 : 1)) {
        const spawn = (0, utils_1.getSpawnsOrderdByRange)(controller, 1).first();
        if (!spawn) {
            console.log(controller.room.name, "controller can't find spawn");
        }
        else if (spawn.room.energyAvailable < 300) {
            console.log(controller.room.name, "Not enough spawn energy");
        }
        else {
            spawn.spawnCreep((0, util_creep_1.filterBodiesByCost)("upgrader", spawn.room.energyAvailable).bodies, `U_${controller.room.name}_${Game.time}`, {
                memory: {
                    baseRoom: controller.room.name,
                    mode: "🛒",
                    role: "upgrader",
                },
            });
        }
    }
};
exports.default = behavior;
function isC(s) {
    return s.structureType === STRUCTURE_CONTROLLER;
}
