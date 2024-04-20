"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.behaviors = void 0;
const role_harvester_1 = __importDefault(require("./role.harvester"));
exports.behaviors = {
    harvester: role_harvester_1.default,
};
