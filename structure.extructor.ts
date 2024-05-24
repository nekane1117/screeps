import { filterBodiesByCost } from "./util.creep";
import { getSpawnsOrderdByRange } from "./utils";

export default function behavior(extractor: Structure) {
  if (!isE(extractor)) {
    return console.log("type is invalid", JSON.stringify(extractor));
  }

  const mineral = _(extractor.pos.lookFor(LOOK_MINERALS)).first();

  if (!mineral) {
    return ERR_NOT_FOUND;
  }

  // 最大匹数より少ないとき
  if (!Object.values(Game.creeps).find((c): c is Harvester => isM(c) && c.memory.targetId === mineral.id)) {
    // 自分用のWORKが5個以下の時
    const spawn = getSpawnsOrderdByRange(extractor, 1).first();
    if (!spawn) {
      console.log(`source ${extractor.id} can't find spawn`);
      return ERR_NOT_FOUND;
    }

    if (spawn.room.energyAvailable > 200) {
      const name = `M_${extractor.room.name}_${Game.time}`;
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

function isM(c: Creeps): c is MineralHarvester {
  return c.memory.role === "mineralHarvester";
}
function isE(s: Structure): s is StructureController {
  return s.structureType === STRUCTURE_EXTRACTOR;
}
