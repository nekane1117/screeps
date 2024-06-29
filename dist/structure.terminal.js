"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const utils_common_1 = require("./utils.common");
const TRANSFER_THRESHOLD = 1000;
function behaviors(terminal) {
    (0, utils_1.logUsage)(`terminal:${terminal.room.name}`, () => {
        if (!isTerminal(terminal)) {
            return console.log(`${terminal.id} is not terminal`);
        }
        if (Game.cpu.bucket < 100 || terminal.cooldown > 0) {
            return;
        }
        const { room } = terminal;
        const terminals = (0, utils_1.getTerminals)();
        for (const resourceType of (0, utils_common_1.ObjectKeys)(terminal.store)) {
            if (terminal.store[resourceType] > room.energyCapacityAvailable + TRANSFER_THRESHOLD * 2) {
                const transferTarget = terminals.find((t) => t.store[resourceType] < TRANSFER_THRESHOLD);
                if (transferTarget) {
                    if (terminal.send(resourceType, TRANSFER_THRESHOLD, transferTarget.room.name) === OK) {
                        break;
                    }
                }
            }
        }
    });
}
exports.default = behaviors;
function isTerminal(s) {
    return s.structureType === STRUCTURE_TERMINAL;
}
