import { ObjectKeys } from "./utils";
import roomBehavior from "./room";

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

  // Room -> Structure -> Creepの順で考える
  Object.values(Game.rooms).map(roomBehavior);
};
