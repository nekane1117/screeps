import flags from "./flags";
import { behaviors } from "./roles";
import { roomBehavior } from "./room";
import structures from "./structures";
import { filterBodiesByCost, toColor } from "./util.creep";
import { findMyStructures, isHighway, logUsage } from "./utils";

module.exports.loop = function () {
  logUsage("all", () => {
    if (Game.cpu.bucket === 10000) {
      Game.cpu.generatePixel();
    }
    //死んだcreepは削除する
    logUsage("delete memoery", () => {
      Object.keys(Memory.creeps).forEach((name) => {
        if (!Game.creeps[name]) {
          delete Memory.creeps[name];
          console.log("Clearing non-existing creep memory:", name);
        }
      });
    });

    // Flag -> Room -> Spawn -> Container -> Creep
    logUsage("flags", () => {
      Object.values(Game.flags).forEach((flag) => flags[flag.color]?.(flag));
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
      Object.values(Game.creeps).forEach((c) => {
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
            .filter((s) => ([STRUCTURE_CONTAINER, STRUCTURE_ROAD] as StructureConstant[]).includes(s.structureType) && s.hits < s.hitsMax)
            .forEach((s) => c.repair(s));
        // 現在地の履歴を更新する
        c.memory.moved === OK && c.room.memory.roadMap && c.room.memory.roadMap[c.pos.y * 50 + c.pos.x]++;
        c.memory.moved === OK && (c.memory.__avoidCreep = false);
      });
    });
    logUsage("constructionSites", () => {
      Object.values(Game.constructionSites).forEach((site) => {
        // 型チェック
        if (site.room?.name && Memory.rooms[site.room?.name]) {
          // builderが一人もいないとき
          if ((Memory.rooms[site.room.name].creeps?.builder || []).length === 0) {
            const spawn: StructureSpawn | undefined = _(Object.values(Game.spawns))
              .map((spawn) => {
                return {
                  spawn,
                  cost: PathFinder.search(site.pos, spawn.pos).cost,
                };
              })
              .min((v) => v.cost)?.spawn;

            // 最寄りのspawnからbuilderを作る
            if (spawn) {
              spawn.spawnCreep(filterBodiesByCost("builder", spawn.room.energyCapacityAvailable).bodies, `B_${site.room.name}_${Game.time}`, {
                memory: {
                  mode: "🛒",
                  baseRoom: site.room.name,
                  role: "builder",
                } as BuilderMemory,
              });
            }
          }
        }
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
