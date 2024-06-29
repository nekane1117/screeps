"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const structure_controller_1 = __importDefault(require("./structure.controller"));
const structure_extructor_1 = __importDefault(require("./structure.extructor"));
const structure_factory_1 = __importDefault(require("./structure.factory"));
const structure_terminal_1 = __importDefault(require("./structure.terminal"));
const structure_tower_1 = __importDefault(require("./structure.tower"));
const structures = {
    controller: structure_controller_1.default,
    extractor: structure_extructor_1.default,
    factory: structure_factory_1.default,
    terminal: structure_terminal_1.default,
    tower: structure_tower_1.default,
};
exports.default = structures;
