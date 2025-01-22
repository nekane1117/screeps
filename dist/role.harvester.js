"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (creep) => {
    var _a;
    if (!isHarvester(creep)) {
        console.log(`${creep.name} is not harvester`);
        return ERR_INVALID_TARGET;
    }
    if (creep.room.name !== creep.memory.baseRoom) {
        return (0, util_creep_1.moveRoom)(creep, creep.room.name, creep.memory.baseRoom);
    }
    const source = Game.getObjectById(creep.memory.harvestTargetId);
    if (!source) {
        return creep.suicide();
    }
    creep.memory.worked = creep.harvest(source);
    switch (creep.memory.worked) {
        case ERR_NOT_IN_RANGE:
            (0, util_creep_1.customMove)(creep, source, {
                ignoreCreeps: true,
                range: 1,
                ignore: (_a = (0, util_creep_1.getCreepsInRoom)(creep.room)
                    .harvester) === null || _a === void 0 ? void 0 : _a.filter((c) => c.id !== creep.id).map((h) => h.pos),
            });
            break;
        case ERR_INVALID_TARGET:
        case ERR_NOT_OWNER:
        case ERR_NOT_FOUND:
        case ERR_NO_BODYPART:
            console.log(`${creep.name} harvest returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
            creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]);
            break;
        case OK:
        case ERR_NOT_ENOUGH_RESOURCES:
            break;
        case ERR_TIRED:
        case ERR_BUSY:
        default:
            creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]);
            break;
    }
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.getActiveBodyparts(WORK) * 5) {
        creep.pos.findInRange(Object.values(Game.constructionSites), 3).map((site) => creep.build(site));
    }
    const repaired = _(creep.pos.findInRange(FIND_STRUCTURES, 3, { filter: (s) => "ticksToDecay" in s && s.hits < Math.min(s.hitsMax, 3000) }))
        .map((damaged) => {
        return creep.repair(damaged);
    })
        .run();
    (0, util_creep_1.pickUpAll)(creep);
    if (repaired.length === 0) {
        const { container: containers, link: links } = (0, utils_1.findMyStructures)(creep.room);
        const link = source.pos.findClosestByRange(links, {
            filter: (s) => s.pos.inRangeTo(source, 2),
        });
        if (link) {
            creep.pos.findInRange(containers, 2).forEach((c) => {
                if (creep.withdraw(c, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE && creep.store.energy > 10) {
                    (0, util_creep_1.customMove)(creep, c);
                }
            });
            if (creep.transfer(link, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE && creep.store.energy > 10) {
                (0, util_creep_1.customMove)(creep, link);
            }
        }
        else {
            const container = source.pos.findClosestByRange(containers, {
                filter: (s) => s.pos.inRangeTo(source, 2),
            });
            if (container) {
                if (creep.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    (0, util_creep_1.customMove)(creep, container);
                }
            }
        }
    }
};
exports.default = behavior;
function isHarvester(c) {
    return "role" in c.memory && c.memory.role === "harvester";
}
