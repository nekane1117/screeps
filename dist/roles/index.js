"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.behaviors = void 0;
const harvester_1 = __importDefault(require("./harvester"));
exports.behaviors = {
    harvester: harvester_1.default,
};
