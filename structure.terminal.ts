import { RETURN_CODE_DECODER } from "util.creep";
import { TRANSFER_THRESHOLD } from "./constants";
import { getTerminals, logUsage } from "./utils";

export default function behaviors(terminal: Structure) {
  logUsage(`terminal:${terminal.room.name}`, () => {
    if (!isTerminal(terminal)) {
      return console.log(`${terminal.id} is not terminal`);
    }

    if (terminal.cooldown > 0) {
      return OK;
    }
    const memory = ((Memory.terminals = Memory.terminals || {})[terminal.id] = Memory.terminals[terminal.id] || {});
    if (memory.lastTrade) {
      terminal.room.visual.text(memory.lastTrade, terminal.pos.x, terminal.pos.y, { font: 0.25, color: "#ffff00" });
    }

    // とにかくリソースを共有する
    const terminals = getTerminals();

    // ターミナルが2個以下の時は特に何もさせない
    if (terminals.length < 2) {
      return OK;
    }

    for (const resourceType of RESOURCES_ALL.filter((r) => {
      if ((terminal.room.controller?.level || 0) === 8) {
        return true;
      } else {
        return r !== RESOURCE_ENERGY;
      }
    })) {
      // 閾値の2倍あるときは不足してるターミナルに送る
      if (terminal.store[resourceType] > _.floor(TRANSFER_THRESHOLD * 2, -2)) {
        const transferTarget = terminals.find((t) => t.store[resourceType] < TRANSFER_THRESHOLD);
        // 足らないターミナルを見つけたとき
        if (transferTarget) {
          console.log(`terminal.send(${resourceType}, ${TRANSFER_THRESHOLD}, ${transferTarget.room.name})`);
          const result = terminal.send(resourceType, TRANSFER_THRESHOLD, transferTarget.room.name);
          if (result === OK) {
            return;
          } else {
            console.log(RETURN_CODE_DECODER[result]);
          }
        }
      }
    }

    // 共有できない or 済んでるとき

    // bucketが500を切ってるときは何もしない
    if (Game.cpu.bucket < 500) {
      return OK;
    }
  });
}

function isTerminal(s: Structure): s is StructureTerminal {
  return s.structureType === STRUCTURE_TERMINAL;
}
