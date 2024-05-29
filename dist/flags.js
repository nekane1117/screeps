"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const flag_red_1 = __importDefault(require("./flag.red"));
const flag_white_1 = __importDefault(require("./flag.white"));
const flag_purple_1 = __importDefault(require("./flag.purple"));
exports.default = {
    [COLOR_RED]: flag_red_1.default,
    [COLOR_WHITE]: flag_white_1.default,
    [COLOR_PURPLE]: flag_purple_1.default,
};
