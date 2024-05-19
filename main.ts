import constructionSite from "./constructionSite";
import { roomBehavior } from "./room";
import { behaviors } from "./roles";
import structures from "./structures";
import { findMyStructures } from "./utils";

module.exports.loop = function () {
  if (Game.cpu.bucket === 10000) {
    Game.cpu.generatePixel();
  }
  //死んだcreepは削除する
  Object.keys(Memory.creeps).forEach((name) => {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
      console.log("Clearing non-existing creep memory:", name);
    }
  });

  Object.keys(Memory.rooms).forEach((name) => {
    if (!Game.rooms[name]) {
      delete Memory.rooms[name];
      console.log("Clearing non-existing rooms memory:", name);
    }
  });

  // Flag -> Room -> Spawn -> Container -> Creep
  Object.values(Game.constructionSites).map(constructionSite);

  Object.values(Game.rooms).forEach((room) => {
    roomBehavior(room);

    // 構造物の動き
    findMyStructures(room).all.map((s) => structures[s.structureType]?.(s));
  });
  // Creepの動き
  Object.values(Game.creeps).map((c) => {
    if (c.spawning) {
      return;
    }
    c.memory.moved = undefined;
    c.room.visual.text(c.name[0], c.pos.x, c.pos.y, {
      color: `#${c.id.slice(-6)}`,
    });
    return behaviors[c.memory.role]?.(c);
  });
};
