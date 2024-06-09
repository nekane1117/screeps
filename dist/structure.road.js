"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const behavior = (road) => {
    if (!isR(road)) {
        return console.log("type is invalid", road);
    }
};
exports.default = behavior;
function isR(s) {
    return s.structureType === STRUCTURE_ROAD;
}
