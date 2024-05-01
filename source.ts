import { BODY } from "./constants";
import { getBodyByCost } from "./utils";

export default function behavior(source: Source) {
  // 建設が無ければ道を敷く
  if (Object.values(Game.constructionSites).length === 0) {
    // 建設が無ければ道を敷く
  }

  // 自分用のCreepを作る
  // 自分用のharvesterの数
  const harvesters = _(Object.values(Game.creeps))
    .filter((c): c is Harvester => {
      const isHarvester = (c: Creep): c is Harvester => {
        return c.memory.role === "harvester";
      };
      return isHarvester(c) && c.memory.harvestTargetId === source.id;
    })
    .run();

  // 今あるWorkの個数
  const works = _(harvesters)
    .map((h) => h.getActiveBodyparts(WORK))
    .sum();

  // 「使えるスペースよりHarvesterが少ない」かつ「WORKが1つもない」か「エネルギーが十分あってWORKが足らない」
  if (
    harvesters.length < source.room.memory.sources[source.id].spaces &&
    ((works === 0 && source.room.energyAvailable > 200) || (source.room.energyAvailable / source.room.energyCapacityAvailable > 0.8 && works < 5))
  ) {
    // 部屋の中で使えるspawnにharvesterを作らせる
    Object.values(Game.spawns)
      .find((spawn) => spawn.room.name === source.room.name && !spawn.spawning)
      ?.spawnCreep(getBodyByCost(BODY.harvester, source.room.energyAvailable), ["H", source.pos.x, source.pos.y, Game.time.toString()].join("_"), {
        memory: {
          role: "harvester",
          harvestTargetId: source.id,
        } as HarvesterMemory,
      });
  }
}
