"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
function behavior(links) {
    const spawn = (() => {
        var _a;
        const room = (_a = _.first(links)) === null || _a === void 0 ? void 0 : _a.room;
        return room && (0, util_creep_1.getMainSpawn)(room);
    })();
    if (!spawn) {
        return ERR_NOT_FOUND;
    }
    const extracter = spawn.pos.findClosestByRange(links);
    if (!extracter) {
        return ERR_NOT_FOUND;
    }
    return links
        .filter((l) => l.id !== extracter.id)
        .map((link) => {
        const amount = _.floor(Math.min(extracter.store.getFreeCapacity(RESOURCE_ENERGY), link.store.energy), -2);
        if (amount > 0) {
            return link.transferEnergy(extracter, amount);
        }
        else {
            return ERR_NOT_ENOUGH_ENERGY;
        }
    });
}
exports.default = behavior;
