"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const role_harvester_1 = __importDefault(require("./role.harvester"));
const roles = {
    harvester: role_harvester_1.default,
};
exports.default = roles;
