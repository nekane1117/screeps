import flags from "./flags";
import { behaviors } from "./roles";
import { roomBehavior } from "./room";
import structures from "./structures";
import { toColor } from "./util.creep";
import { findMyStructures, isHighway, logUsage } from "./utils";
import { ObjectKeys } from "./utils.common";

module.exports.loop = function () {
  console.log(`start ${Game.time}`);
  if (Game.cpu.bucket === undefined || Game.cpu.bucket > 200) {
    Memory.do = true;
  } else if (Game.cpu.bucket < 100) {
    Memory.do = false;
  }

  if (!Memory.do) {
    console.log(`end bucket不足(${Game.cpu.bucket}) usage : ${Game.cpu.getUsed()}`);
    return;
  }

  logUsage("all", () => {
    if (Game.cpu.bucket === 10000) {
      Game.cpu.generatePixel();
    }
    if (Game.cpu.bucket < 100) {
      console.log(`bucket不足 :(${Game.cpu.bucket})`);
      return;
    }

    // Flag -> Room -> Spawn -> Container -> Creep
    logUsage("flags", () => {
      Object.values(Game.flags).forEach((flag) => flags[flag.color]?.(flag));
    });

    const creeps = Object.values(Game.creeps).reduce(
      (mapping, creep) => {
        mapping[creep.memory.baseRoom] = (mapping[creep.memory.baseRoom] || []).concat(creep);
        return mapping;
      },
      {} as Partial<Record<string, Creep[]>>,
    );

    Object.values(Game.rooms)
      .filter((room) => !isHighway(room) && room.controller?.my)
      .forEach((room) => {
        logUsage(room.name, () => {
          logUsage("roomBehavior", () => roomBehavior(room));
          // 構造物の動き
          logUsage("structures", () => findMyStructures(room).all.forEach((s) => structures[s.structureType]?.(s)));
          // Creepの動き
          logUsage(`creep(${creeps[room.name]?.length})`, () => {
            creeps[room.name]?.map((c) => {
              return logUsage(
                c.name,
                () => {
                  if (c.spawning) {
                    return;
                  }
                  c.memory.moved = undefined;
                  c.room.visual.text(c.name.split("_")[0], c.pos.x, c.pos.y, {
                    color: toColor(c),
                  });
                  behaviors[c.memory.role]?.(c);
                  // 通った場所はみんなで直す
                  if (c.getActiveBodyparts(WORK)) {
                    c.pos
                      .lookFor(LOOK_STRUCTURES)
                      .filter((s) => ([STRUCTURE_CONTAINER, STRUCTURE_ROAD] as StructureConstant[]).includes(s.structureType) && s.hits < s.hitsMax)
                      .forEach((s) => c.repair(s));
                  }
                  // 現在地の履歴を更新する
                  if (c.memory.moved === OK) {
                    if (c.room.memory.roadMap) {
                      c.room.memory.roadMap[c.pos.y * 50 + c.pos.x]++;
                    }
                    c.memory.__avoidCreep = false;
                  }
                },
                0.5,
              );
            });
          });
        });
      });
  });
  //死んだcreepは削除する
  logUsage("delete", () => {
    Object.keys(Memory.creeps).forEach((name) => {
      if (!Game.creeps[name]) {
        delete Memory.creeps[name];
        console.log("Clearing non-existing creep memory:", name);
      }
    });
    Object.keys(Memory.rooms).forEach((name) => {
      if (!Game.rooms[name]?.controller?.my) {
        delete Memory.rooms[name];
      }
    });
    Object.values(Memory.rooms).forEach((mem) => {
      delete mem.find;
    });
    ObjectKeys(Memory.factories).forEach((id: Id<StructureFactory>) => {
      if (!Game.getObjectById(id)) {
        delete Memory.factories[id];
      }
    });
    ObjectKeys(Memory.terminals).forEach((id) => {
      if (!Game.getObjectById(id)) {
        delete Memory.terminals[id];
      }
    });
  });
  console.log(`end ${Game.time} usage : ${Game.cpu.getUsed()}`);
};
