"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const utils_1 = require("./utils");
function default_1(controller) {
    var _a, _b;
    if (!isContoller(controller)) {
        return console.log(`${controller.id} is not contoller:${controller.structureType}`);
    }
    const creeps = (0, utils_1.getCreepNamesInRoom)(controller.room);
    const { energyAvailable } = controller.room;
    if (((_a = creeps.upgrader) === null || _a === void 0 ? void 0 : _a.length) === 0 && energyAvailable > 200) {
        (_b = (0, utils_1.getSpawnsInRoom)(controller.room)
            .find((s) => !s.spawning)) === null || _b === void 0 ? void 0 : _b.spawnCreep((0, utils_1.getBodyByCost)(constants_1.BODY.upgrader, energyAvailable), `U_${controller.room.name}`, {
            memory: {
                role: "upgrader",
                mode: "collecting",
            },
        });
    }
}
exports.default = default_1;
function isContoller(s) {
    return s.structureType === STRUCTURE_CONTROLLER;
}
