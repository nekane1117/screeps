"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const structure_container_1 = __importDefault(require("./structure.container"));
const structure_tower_1 = __importDefault(require("./structure.tower"));
const structures = {
    container: structure_container_1.default,
    tower: structure_tower_1.default,
};
exports.default = structures;
