"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectEntries = exports.ObjectKeys = exports.defaultTo = void 0;
function defaultTo(value, defaultValue) {
    if (value === undefined || value === null) {
        return defaultValue;
    }
    else {
        return value;
    }
}
exports.defaultTo = defaultTo;
function ObjectKeys(o) {
    return Object.keys(o);
}
exports.ObjectKeys = ObjectKeys;
function ObjectEntries(o) {
    return Object.entries(o);
}
exports.ObjectEntries = ObjectEntries;
