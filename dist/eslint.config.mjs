"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = __importDefault(require("globals"));
const js_1 = __importDefault(require("@eslint/js"));
const typescript_eslint_1 = __importDefault(require("typescript-eslint"));
exports.default = [
    { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
    { languageOptions: { globals: Object.assign(Object.assign({}, globals_1.default.node), { _: "readonly" }) } },
    js_1.default.configs.recommended,
    ...typescript_eslint_1.default.configs.recommended,
    {
        ignores: ["**/*.d.ts", "dist", "lodash_4_17_15.js"],
    },
    {
        rules: {
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    varsIgnorePattern: "^_",
                    argsIgnorePattern: "^_",
                },
            ],
        },
    },
];
