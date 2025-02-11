import { filterBodiesByCost, getCreepsInRoom } from "./util.creep";
import { getSpawnsOrderdByRange } from "./utils";

export default function behavior(extractor: Structure) {
  if (!isE(extractor)) {
    return console.log("type is invalid", JSON.stringify(extractor));
  }

  const mineral = _(extractor.pos.lookFor(LOOK_MINERALS)).first();
  if (!mineral || mineral.ticksToRegeneration || !extractor.room.terminal) {
    return ERR_NOT_FOUND;
  }

  // if (extractor.room.terminal.store[mineral.mineralType] > TERMINAL_LIMIT * 2) {
  //   // とりあえずいっぱいあるときはいい
  //   return;
  // }

  const { mineralHarvester = [] } = getCreepsInRoom(mineral.room);

  // 最大匹数より少ないとき
  if (mineral.mineralAmount > 0 && mineralHarvester.length < 1) {
    const spawn = getSpawnsOrderdByRange(extractor, 1).first();
    if (!spawn) {
      console.log(`source ${extractor.id} can't find spawn`);
      return ERR_NOT_FOUND;
    }

    if (spawn.room.energyAvailable > 200) {
      const name = `Mh_${extractor.room.name}_${Game.time}`;
      const spawned = spawn.spawnCreep(filterBodiesByCost("mineralHarvester", spawn.room.energyAvailable).bodies, name, {
        memory: {
          role: "mineralHarvester",
          baseRoom: extractor.room.name,
          targetId: mineral.id,
        } as MineralHarvesterMemory,
      });
      return spawned;
    }
  }
  return OK;
}

function isE(s: Structure): s is StructureController {
  return s.structureType === STRUCTURE_EXTRACTOR;
}
