"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultTo = void 0;
function defaultTo(value, defaultValue) {
    if (value === undefined || value === null) {
        return defaultValue;
    }
    else {
        return value;
    }
}
exports.defaultTo = defaultTo;
