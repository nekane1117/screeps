import constructionSite from "./constructionSite";
import flags from "./flags";
import { behaviors } from "./roles";
import { roomBehavior } from "./room";
import structures from "./structures";
import { toColor } from "./util.creep";
import { findMyStructures, isHighway, logUsage } from "./utils";

module.exports.loop = function () {
  logUsage("measure tick time", () => {
    Memory.realTImes = (Memory.realTImes || [])
      .concat({
        time: Game.time,
        unixTime: new Date().valueOf(),
      })
      .slice(-100);
  });
  logUsage("all", () => {
    if (Game.cpu.bucket === 10000) {
      Game.cpu.generatePixel();
    }
    //死んだcreepは削除する
    logUsage("delete memoery", () => {
      if (Object.keys(Game.creeps).length !== Object.keys(Memory.creeps).length) {
        Object.keys(Memory.creeps).forEach((name) => {
          if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log("Clearing non-existing creep memory:", name);
          }
        });
      }
    });

    // Flag -> Room -> Spawn -> Container -> Creep
    logUsage("flags", () => {
      Object.values(Game.flags).forEach((flag) => flags[flag.color]?.(flag));
    });

    logUsage("sites", () => {
      // 今のところ１部屋１回走ればいい処理なので処理した部屋を覚える
      const executedRoom: Partial<Record<string, boolean>> = {};
      Object.values(Game.constructionSites).forEach((s) => {
        if (executedRoom[s.pos.roomName]) {
          return;
        } else {
          constructionSite(s);
          executedRoom[s.pos.roomName] = true;
        }
      });
    });
    logUsage("rooms", () => {
      Object.values(Game.rooms)
        .filter((room) => !isHighway(room) && room.controller?.my)
        .forEach((room) => {
          roomBehavior(room);
          // 構造物の動き
          findMyStructures(room).all.forEach((s) => structures[s.structureType]?.(s));
        });
    });
    // Creepの動き
    logUsage("creep", () => {
      Object.values(Game.creeps)
        .sort((c1, c2) => {
          const getPriority = (creep: Creeps) => {
            switch (creep.memory.role) {
              case "harvester":
                return 0;
              case "carrier":
                return 1;
              default:
                return 2;
            }
          };
          return getPriority(c1) - getPriority(c2);
        })
        .forEach((c) => {
          if (c.spawning) {
            return;
          }
          c.memory.moved = undefined;
          c.room.visual.text(c.name.split("_")[0], c.pos.x, c.pos.y, {
            color: toColor(c),
          });
          behaviors[c.memory.role]?.(c);
          // 通った場所はみんなで直す
          c.getActiveBodyparts(WORK) &&
            c.pos
              .lookFor(LOOK_STRUCTURES)
              .filter((s) => "ticksToDecay" in s && s.hits < s.hitsMax)
              .forEach((s) => c.repair(s));
          c.memory.__avoidCreep = Math.max(0, (c.memory.__avoidCreep || 0) - 1);
        });
    });

    Object.keys(Memory.rooms).forEach((name) => {
      if (!Game.rooms[name]?.controller?.my) {
        delete Memory.rooms[name];
      }
    });

    Object.values(Memory.rooms).forEach((mem) => {
      delete mem.find;
      delete mem.creeps;
    });
  });
};
