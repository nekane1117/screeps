import { getTerminals, logUsage } from "./utils";

/** terminal間輸送閾値 */
const TRANSFER_THRESHOLD = 1000;

export default function behaviors(terminal: Structure) {
  logUsage(`terminal:${terminal.room.name}`, () => {
    if (!isTerminal(terminal)) {
      return console.log(`${terminal.id} is not terminal`);
    }

    const memory = ((Memory.terminals = Memory.terminals || {})[terminal.id] = Memory.terminals[terminal.id] || {});

    memory.lastTrade && terminal.room.visual.text(memory.lastTrade, terminal.pos.x, terminal.pos.y, { font: 0.25, color: "#ffff00" });
    if (Game.cpu.bucket < 1000 || terminal.cooldown > 0) {
      return;
    }

    const { room } = terminal;

    // とにかくリソースを共有する
    const terminals = getTerminals();
    for (const resourceType of RESOURCES_ALL) {
      // 閾値の2倍あるときは不足してるターミナルに送る
      if (terminal.store[resourceType] > room.energyCapacityAvailable + TRANSFER_THRESHOLD * 2) {
        const transferTarget = terminals.find((t) => t.store[resourceType] < TRANSFER_THRESHOLD * 2);
        // 足らないターミナルを見つけたとき
        if (transferTarget) {
          if (terminal.send(resourceType, TRANSFER_THRESHOLD * 2, transferTarget.room.name) === OK) {
            break;
          }
        }
      }
    }
  });
}

function isTerminal(s: Structure): s is StructureTerminal {
  return s.structureType === STRUCTURE_TERMINAL;
}

// const BASE_MINERALS = [RESOURCE_HYDROGEN, RESOURCE_OXYGEN, RESOURCE_UTRIUM, RESOURCE_KEANIUM, RESOURCE_LEMERGIUM, RESOURCE_ZYNTHIUM, RESOURCE_CATALYST];
