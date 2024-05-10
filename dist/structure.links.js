"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
const utils_1 = require("./utils");
function behavior(links) {
    const spawn = (() => {
        var _a;
        const room = (_a = _.first(links)) === null || _a === void 0 ? void 0 : _a.room;
        return room && _.first((0, util_creep_1.getSpawnsInRoom)(room));
    })();
    if (!spawn) {
        return ERR_NOT_FOUND;
    }
    const extracter = spawn.pos.findClosestByRange(links);
    if (!extracter) {
        return ERR_NOT_FOUND;
    }
    if ((0, utils_1.getCapacityRate)(extracter) > 0.5) {
        return ERR_FULL;
    }
    return links.map((link) => {
        if ((0, utils_1.getCapacityRate)(link) > 0.9) {
            return link.transferEnergy(extracter);
        }
        else {
            return ERR_NOT_ENOUGH_ENERGY;
        }
    });
}
exports.default = behavior;
