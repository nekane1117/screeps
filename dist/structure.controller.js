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
    const { harvester = [], upgrader = [], carrier = [] } = (0, util_creep_1.getCreepsInRoom)(controller.room);
    const { container } = (0, utils_1.findMyStructures)(controller.room);
    const containerSite = (0, utils_1.getSitesInRoom)(controller.room).filter((s) => s.structureType === STRUCTURE_CONTAINER);
    const mainSpawn = (0, util_creep_1.getMainSpawn)(controller.room);
    if (mainSpawn) {
        const myContainer = controller.pos.findClosestByRange([...container, ...containerSite], {
            filter: (s) => controller.pos.inRangeTo(s, 3),
        });
        if (myContainer) {
            if (!("progress" in myContainer) &&
                harvester.length > 0 &&
                carrier.length > 0 &&
                upgrader.length === 0 &&
                controller.room.energyAvailable === controller.room.energyCapacityAvailable) {
                console.log("create upgrader");
                const spawn = _((0, utils_1.getSpawnsInRoom)(controller.room)).find((s) => !s.spawning);
                if (spawn) {
                    spawn.spawnCreep(getUpgraderBody(controller), `U_${controller.room.name}_${Game.time}`, {
                        memory: {
                            baseRoom: controller.room.name,
                            mode: "🛒",
                            role: "upgrader",
                        },
                    });
                }
            }
        }
        else {
            const terrain = controller.room.getTerrain();
            const firstStep = controller.pos.findPathTo(mainSpawn).find((p) => terrain.get(p.x, p.y) !== TERRAIN_MASK_WALL);
            if (firstStep) {
                new RoomPosition(firstStep.x, firstStep.y, controller.room.name).createConstructionSite(STRUCTURE_CONTAINER);
            }
        }
    }
};
exports.default = behavior;
function isC(s) {
    return s.structureType === STRUCTURE_CONTROLLER;
}
function getUpgraderBody(c) {
    const b = [WORK, WORK, WORK, MOVE];
    let total = 0;
    return [WORK, MOVE, CARRY, WORK]
        .concat(..._.range(50).map((i) => {
        return b[i % b.length];
    }))
        .slice(0, 50)
        .map((parts) => {
        total += BODYPART_COST[parts];
        return {
            parts,
            total,
        };
    })
        .filter((i) => {
        return i.total <= c.room.energyAvailable;
    })
        .map((i) => i.parts);
}
