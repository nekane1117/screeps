"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function behavior(flag) {
    var _a;
    if (flag.color !== COLOR_PURPLE) {
        console.log(`${flag.name} is not purple`);
        return ERR_INVALID_ARGS;
    }
    const room = Game.rooms[flag.pos.roomName];
    if ((_a = room.controller) === null || _a === void 0 ? void 0 : _a.my) {
        room.find(FIND_STRUCTURES).forEach((s) => s.destroy());
        Object.values(Game.creeps)
            .filter((c) => c.pos.roomName === flag.pos.roomName || c.memory.baseRoom === flag.pos.roomName)
            .forEach((c) => c.suicide());
        Object.values(Game.constructionSites)
            .filter((c) => c.pos.roomName === flag.pos.roomName)
            .forEach((c) => c.remove());
        room.controller.unclaim();
    }
    flag.remove();
}
exports.default = behavior;
