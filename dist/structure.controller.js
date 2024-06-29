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
            const center = (0, util_creep_1.getMainSpawn)(controller.room) || controller;
            controller.room.visual.text(text, Math.max(center.pos.x - 3, 1), Math.max(1, center.pos.y - 3 - texts.length + i), { align: "left" });
        });
    };
    showSummary([
        `energy  : ${controller.room.energyAvailable} / ${controller.room.energyCapacityAvailable}`,
        `bucket  : ${(_a = Game.cpu.bucket) === null || _a === void 0 ? void 0 : _a.toLocaleString()}`,
        `progress:${(controller.progressTotal - controller.progress).toLocaleString()}`,
    ]);
    updateUpgraderSize(controller.room);
    const { harvester = [], upgrader = [], carrier = [] } = (0, util_creep_1.getCreepsInRoom)(controller.room);
    const { container, extension } = (0, utils_1.findMyStructures)(controller.room);
    const containerSite = (0, utils_1.getSitesInRoom)(controller.room).filter((s) => s.structureType === STRUCTURE_CONTAINER);
    const mainSpawn = (0, util_creep_1.getMainSpawn)(controller.room);
    if (mainSpawn) {
        const myContainer = controller.pos.findClosestByRange([...container, ...containerSite], {
            filter: (s) => controller.pos.inRangeTo(s, 3),
        });
        const upgraderBody = getUpgraderBody(controller.room);
        if (myContainer) {
            if (!("progress" in myContainer) &&
                extension.length >= CONTROLLER_STRUCTURES.extension[controller.level] &&
                myContainer.store.energy &&
                harvester.length > 0 &&
                carrier.length > 0 &&
                upgrader.filter((c) => (c.ticksToLive || Infinity) > upgraderBody.length * CREEP_SPAWN_TIME).length === 0 &&
                controller.room.energyAvailable === controller.room.energyCapacityAvailable) {
                const spawn = _((0, utils_1.getSpawnsInRoom)(controller.room)).find((s) => !s.spawning);
                if (spawn) {
                    spawn.spawnCreep(upgraderBody, `U_${controller.room.name}_${Game.time}`, {
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
function updateUpgraderSize(room) {
    const memory = room.memory;
    if (!memory.carrySize) {
        memory.carrySize = {};
    }
    if (!memory.carrySize.upgrader) {
        memory.carrySize.upgrader = 1;
    }
    const border = CREEP_LIFE_TIME / 4;
    memory.carrySize.upgrader =
        (memory.carrySize.upgrader * border +
            _(room.getEventLog())
                .map((e) => e.event === EVENT_UPGRADE_CONTROLLER && e.data.energySpent)
                .compact()
                .sum()) /
            (border + 1);
}
function getUpgraderBody(room) {
    var _a;
    const requestSize = _.ceil(((((_a = room.memory.carrySize) === null || _a === void 0 ? void 0 : _a.upgrader) || 1) * 2) / 2);
    let totalCost = 0;
    return _([CARRY])
        .concat(..._.range(requestSize).map(() => {
        return [WORK, WORK, MOVE];
    }))
        .flatten()
        .map((parts) => {
        totalCost += BODYPART_COST[parts];
        return {
            parts,
            totalCost,
        };
    })
        .filter((p) => {
        return p.totalCost <= room.energyAvailable;
    })
        .map((p) => p.parts)
        .value();
}
