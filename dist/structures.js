"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const structure_controller_1 = __importDefault(require("./structure.controller"));
const structure_extructor_1 = __importDefault(require("./structure.extructor"));
const structure_road_1 = __importDefault(require("./structure.road"));
const structure_tower_1 = __importDefault(require("./structure.tower"));
const structures = {
    controller: structure_controller_1.default,
    extractor: structure_extructor_1.default,
    road: structure_road_1.default,
    tower: structure_tower_1.default,
};
exports.default = structures;
