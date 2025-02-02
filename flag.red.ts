import { filterBodiesByCost } from "./util.creep";
import { getSpawnsOrderdByRange } from "./utils";

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
    })
  ) {
    // 最寄りのspawn
    const spawn = getSpawnsOrderdByRange(flag).find((s) => Game.rooms[s.room.name]?.controller?.level);

    // 作らせる
    if (spawn) {
      if (spawn.spawning) {
        console.log("closest spawn spawning");
      } else {
        if (spawn.room.energyAvailable > 650) {
          spawn.spawnCreep(filterBodiesByCost("claimer", spawn.room.energyAvailable).bodies, `C_${flag.pos.roomName}_${flag.name}`, {
            memory: {
              role: "claimer",
              baseRoom: (flag.room || spawn.room).name,
              flagName: flag.name,
            } as ClaimerMemory,
          });
        } else {
          console.log(spawn.name, "spawn energy is shorage");
        }
      }
    } else {
      console.log("spawn not found");
    }
  }

  // 自分のものになったらそこにspawnを立てて消す
  if (flag.room?.controller?.my && flag.pos.createConstructionSite(STRUCTURE_SPAWN) === OK) {
    flag.remove();
  }
}
