"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
const behavior = (creep) => {
    if (!isM(creep)) {
        return console.log(`${creep.name} is not MineralHarvester`);
    }
    const moveMeTo = (target, opt) => (0, util_creep_1.customMove)(creep, target, Object.assign({}, opt));
    const mineral = Game.getObjectById(creep.memory.targetId);
    if (!mineral) {
        return creep.suicide();
    }
    if (creep.store.getFreeCapacity(mineral.mineralType) > 0) {
        creep.memory.worked = creep.harvest(mineral);
        switch (creep.memory.worked) {
            case ERR_NOT_IN_RANGE:
                (0, util_creep_1.customMove)(creep, mineral);
                break;
            case ERR_INVALID_TARGET:
            case ERR_NOT_OWNER:
            case ERR_NOT_FOUND:
            case ERR_NO_BODYPART:
                console.log(`${creep.name} harvest returns ${util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
                creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]);
                break;
            case OK:
            case ERR_TIRED:
            case ERR_NOT_ENOUGH_RESOURCES:
                break;
            case ERR_BUSY:
            default:
                creep.say(util_creep_1.RETURN_CODE_DECODER[creep.memory.worked.toString()]);
                break;
        }
        (0, util_creep_1.pickUpAll)(creep, mineral.mineralType);
    }
    const container = _(mineral.pos.findInRange([
        ...((0, utils_1.findMyStructures)(creep.room).container || []),
        ...Object.values(Game.constructionSites).filter((s) => s.pos.roomName === creep.pos.roomName && s.structureType === STRUCTURE_CONTAINER),
    ], 2)).first();
    if (container) {
        if (!("progress" in container)) {
            if (creep.transfer(container, mineral.mineralType) === ERR_NOT_IN_RANGE) {
                moveMeTo(new RoomPosition(Math.round((mineral.pos.x + container.pos.x) / 2), Math.round((mineral.pos.y + container.pos.y) / 2), creep.room.name));
            }
        }
    }
    else {
        const spawn = (0, util_creep_1.getMainSpawn)(creep.room);
        if (spawn) {
            const pos = _(mineral.pos.findPathTo(spawn, {
                ignoreCreeps: true,
                swampCost: 2,
                plainCost: 2,
            })).run()[1];
            if (pos) {
                creep.room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER);
            }
        }
        else {
            console.log("spawn not found");
        }
    }
};
exports.default = behavior;
function isM(c) {
    return c.memory.role === "mineralHarvester";
}
