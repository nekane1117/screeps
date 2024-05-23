import constructionSite from "./constructionSite";
import flags from "./flags";
import { behaviors } from "./roles";
import { roomBehavior } from "./room";
import structures from "./structures";
import { toColor } from "./util.creep";
import { findMyStructures, logUsage } from "./utils";

module.exports.loop = function () {
  if (Game.cpu.bucket < 20) {
    return;
  }

  logUsage("all", () => {
    // if (Game.cpu.bucket === 10000) {
    //   Game.cpu.generatePixel();
    // }
    //死んだcreepは削除する
    if (Game.time % 100 === 0) {
      Object.keys(Memory.creeps).forEach((name) => {
        if (!Game.creeps[name]) {
          delete Memory.creeps[name];
          console.log("Clearing non-existing creep memory:", name);
        }
      });
    }

    // Flag -> Room -> Spawn -> Container -> Creep
    Object.values(Game.flags).forEach((flag) => flags[flag.color]?.(flag));
    const executedRoom: Partial<Record<string, boolean>> = {};
    Object.values(Game.constructionSites).forEach((s) => {
      if (executedRoom[s.pos.roomName]) {
        return;
      } else {
        constructionSite(s);
        executedRoom[s.pos.roomName] = true;
      }
    });
    logUsage("rooms", () => {
      Object.values(Game.rooms).forEach((room) => {
        logUsage(room.name, () => {
          logUsage("roomBehavior:" + room.name, () => {
            roomBehavior(room);
          });
          // 構造物の動き
          findMyStructures(room).all.forEach((s) => structures[s.structureType]?.(s));
        });
      });
    });
    // Creepの動き
    logUsage("creep", () => {
      Object.values(Game.creeps).forEach((c) => {
        if (c.spawning) {
          return;
        }
        c.memory.moved = undefined;
        c.room.visual.text(c.name[0], c.pos.x, c.pos.y, {
          color: toColor(c),
        });
        behaviors[c.memory.role]?.(c);
      });
    });
  });
};
