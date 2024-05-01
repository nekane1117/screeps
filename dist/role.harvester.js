"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const behavior = (creep) => {
    if (!isMe(creep)) {
        console.log(`${creep.name} is not harvester`);
        return ERR_INVALID_TARGET;
    }
    const source = Game.getObjectById(creep.memory.harvestTargetId);
    if (!source) {
        return creep.suicide();
    }
    creep.memory.harvested = creep.harvest(source);
    switch (creep.memory.harvested) {
        case ERR_NOT_IN_RANGE: {
            if (creep.moveTo(source, {
                plainCost: 2,
                ignoreCreeps: !creep.pos.inRangeTo(source, 3),
            }) === ERR_NO_PATH) {
                for (const neighbor of creep.pos.findInRange(FIND_MY_CREEPS, 1)) {
                    if (creep.pull(neighbor) === OK && neighbor.moveTo(creep) === OK) {
                        break;
                    }
                }
            }
            break;
        }
        case ERR_INVALID_TARGET:
        case ERR_NOT_OWNER:
        case ERR_NOT_FOUND:
        case ERR_NO_BODYPART:
            console.log(`${creep.name} harvest returns ${constants_1.RETURN_CODE_DECODER[creep.memory.harvested.toString()]}`);
            creep.say(constants_1.RETURN_CODE_DECODER[creep.memory.harvested.toString()]);
            break;
        case ERR_NOT_ENOUGH_RESOURCES:
        case OK:
        case ERR_TIRED:
        case ERR_BUSY:
        default:
            break;
    }
    creep.pos.findInRange(Object.values(Game.constructionSites), 3).map((site) => creep.build(site));
    return creep.memory.harvested;
};
exports.default = behavior;
function isMe(c) {
    return c.memory.role === "harvester";
}
