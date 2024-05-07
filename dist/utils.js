"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCapacityRate = void 0;
function getCapacityRate(s, type) {
    var _a, _b;
    if ("store" in s) {
        return ((_a = s.store.getUsedCapacity(type)) !== null && _a !== void 0 ? _a : 0) / ((_b = s.store.getCapacity(type)) !== null && _b !== void 0 ? _b : 1);
    }
    else {
        return Infinity;
    }
}
exports.getCapacityRate = getCapacityRate;
