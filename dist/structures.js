"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const structure_tower_1 = __importDefault(require("./structure.tower"));
const structure_controller_1 = __importDefault(require("./structure.controller"));
const structure_extructor_1 = __importDefault(require("./structure.extructor"));
const structures = {
    tower: structure_tower_1.default,
    controller: structure_controller_1.default,
    extractor: structure_extructor_1.default,
};
exports.default = structures;
