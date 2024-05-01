import { ObjectKeys } from "./utils";
import roomBehavior from "./room";
import roles from "./roles";

module.exports.loop = function () {
  // ピクセル生成
  if (Game.time % 100 === 0 && Game.cpu.bucket == 10000) {
    Game.cpu.generatePixel();
  }

  //死んだcreepは削除する
  ObjectKeys(Memory.creeps || {}).forEach((name) => {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
      console.log("Clearing non-existing creep memory:", name);
    }
  });
  ObjectKeys(Memory.rooms || {}).forEach((name) => {
    if (!Game.rooms[name]) {
      delete Memory.rooms[name];
      console.log("Clearing non-existing rooms memory:", name);
    }
  });

  // Room -> Creepの順で考えておく
  Object.values(Game.rooms).map(roomBehavior);
  Object.values(Game.creeps).map((c) => roles[c.memory.role]?.(c));
};
