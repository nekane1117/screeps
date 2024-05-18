"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.behaviors = void 0;
const role_builder_1 = __importDefault(require("./role.builder"));
const role_claimer_1 = __importDefault(require("./role.claimer"));
const role_distributer_1 = __importDefault(require("./role.distributer"));
const role_gatherer_1 = __importDefault(require("./role.gatherer"));
const role_harvester_1 = __importDefault(require("./role.harvester"));
const role_repairer_1 = __importDefault(require("./role.repairer"));
const role_upgrader_1 = __importDefault(require("./role.upgrader"));
exports.behaviors = {
    harvester: role_harvester_1.default,
    upgrader: role_upgrader_1.default,
    builder: role_builder_1.default,
    gatherer: role_gatherer_1.default,
    repairer: role_repairer_1.default,
    distributer: role_distributer_1.default,
    claimer: role_claimer_1.default,
};
