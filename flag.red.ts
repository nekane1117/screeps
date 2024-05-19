import { filterBodiesByCost } from "./util.creep";

/**
 * 赤い旗
 * 占領用
 */
export default function behavior(flag: Flag) {
  if (flag.color !== COLOR_RED) {
    console.log(`${flag.name} is not red`);
    return ERR_INVALID_ARGS;
  }

  // claimerが居ないとき
  if (
    !Object.values(Game.creeps).find((c) => {
      const isC = (c: Creeps): c is Claimer => {
        return c.memory.role === "claimer";
      };
      return isC(c) && c.memory.flagName === flag.name;
    }) &&
    Object.values(Game.constructionSites).length === 0
  ) {
    // 最寄りのspawn
    const spawn = _(Object.values(Game.spawns))
      .sort((s) => Game.map.getRoomLinearDistance(flag.pos.roomName, s.pos.roomName))
      .first();

    // 作らせる
    if (spawn && !spawn.spawning && spawn.room.energyAvailable > 650) {
      const { bodies, cost } = filterBodiesByCost("claimer", spawn.room.energyAvailable);
      if (
        spawn.spawnCreep(bodies, `C_${flag.pos.roomName}_${flag.name}`, {
          memory: {
            role: "claimer",
            baseRoom: spawn.room.name,
            flagName: flag.name,
          } as ClaimerMemory,
        }) === OK
      ) {
        flag.room?.memory.energySummary?.push({
          consumes: cost,
          production: 0,
          time: new Date().valueOf(),
        });
      }
    }
  }

  // 自分のものになったらそこにspawnを立てて消す
  if (flag.room?.controller?.my && flag.pos.createConstructionSite(STRUCTURE_SPAWN) === OK) {
    flag.remove();
  }
}
