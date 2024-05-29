/**
 * 紫の旗
 * 放棄用
 */
export default function behavior(flag: Flag) {
  if (flag.color !== COLOR_PURPLE) {
    console.log(`${flag.name} is not purple`);
    return ERR_INVALID_ARGS;
  }

  const room = Game.rooms[flag.pos.roomName];

  if (room.controller?.my) {
    // ぜんぶ壊す
    room.find(FIND_STRUCTURES).forEach((s) => s.destroy());

    // ぜんぶ殺す
    Object.values(Game.creeps)
      .filter((c) => c.pos.roomName === flag.pos.roomName || c.memory.baseRoom === flag.pos.roomName)
      .forEach((c) => c.suicide());

    // ぜんぶ殺す
    Object.values(Game.constructionSites)
      .filter((c) => c.pos.roomName === flag.pos.roomName)
      .forEach((c) => c.remove());
    // 放棄する
    room.controller.unclaim();
  }

  flag.remove();
}
