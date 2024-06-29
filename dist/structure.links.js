"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_creep_1 = require("./util.creep");
function behavior(links) {
    var _a;
    const room = (_a = _.first(links)) === null || _a === void 0 ? void 0 : _a.room;
    const center = room && (room.storage || (0, util_creep_1.getMainSpawn)(room));
    if (!center) {
        return;
    }
    const [centerLink, ...tail] = _(links)
        .sortBy((l) => {
        return l.pos.getRangeTo(center);
    })
        .value();
    tail.reverse().forEach((l) => {
        if (l.cooldown === 0 && l.store.energy >= 100) {
            l.transferEnergy(centerLink, _.floor(Math.min(l.store.energy, centerLink.store.getFreeCapacity(RESOURCE_ENERGY)), -2));
        }
    });
}
exports.default = behavior;
