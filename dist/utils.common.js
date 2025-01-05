"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultTo = defaultTo;
exports.ObjectKeys = ObjectKeys;
exports.ObjectEntries = ObjectEntries;
function defaultTo(value, defaultValue) {
    if (value === undefined || value === null) {
        return defaultValue;
    }
    else {
        return value;
    }
}
function ObjectKeys(o) {
    return Object.keys(o);
}
function ObjectEntries(o) {
    return Object.entries(o);
}
