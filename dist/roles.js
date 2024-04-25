"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.behaviors = void 0;
const role_harvester_1 = __importDefault(require("./role.harvester"));
const role_upgrader_1 = __importDefault(require("./role.upgrader"));
const role_builder_1 = __importDefault(require("./role.builder"));
const role_carrier_1 = __importDefault(require("./role.carrier"));
const role_repairer_1 = __importDefault(require("./role.repairer"));
exports.behaviors = {
    harvester: role_harvester_1.default,
    upgrader: role_upgrader_1.default,
    builder: role_builder_1.default,
    carrier: role_carrier_1.default,
    repairer: role_repairer_1.default,
};
