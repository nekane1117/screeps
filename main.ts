import { roomBehavior } from "./role.room";
import spawnBehavior from "./role.spawn";
import { behaviors } from "./roles";
import structures from "./structures";

module.exports.loop = function () {
  if (Game.time % 100 === 0 && Game.cpu.bucket == 10000) {
    Game.cpu.generatePixel();
  }
  //死んだcreepは削除する
  Object.keys(Memory.creeps || {}).forEach((name) => {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
      console.log("Clearing non-existing creep memory:", name);
    }
  });

  Object.keys(Memory.rooms || {}).forEach((name) => {
    if (!Game.rooms[name]) {
      delete Memory.rooms[name];
      console.log("Clearing non-existing rooms memory:", name);
    }
  });

  Memory.sources = Memory.sources || {};

  // Room -> Spawn -> Container -> Creep
  const spawnGroup = _.groupBy(Object.values(Game.spawns), (c) => c.room.name);
  const creepGroup = _.groupBy(Object.values(Game.creeps), (c) => c.room.name);

  Object.entries(Game.rooms).forEach(([_roomName, room]) => {
    roomBehavior(room);

    spawnGroup[room.name]?.map(spawnBehavior);

    // 構造物の動き
    room.find(FIND_STRUCTURES).map((s) => structures[s.structureType]?.(s));

    // Creepの動き
    creepGroup[room.name]?.map((c) => {
      if (c.spawning) {
        return;
      }
      c.memory.moved = undefined;
      return behaviors[c.memory.role]?.(c);
    });
  });
};
