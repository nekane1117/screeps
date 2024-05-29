import { MINERAL_THRESHOLD } from "./constants";
import { filterBodiesByCost } from "./util.creep";
import { findMyStructures, getSpawnsOrderdByRange } from "./utils";

export default function behavior(extractor: Structure) {
  if (!isE(extractor)) {
    return console.log("type is invalid", JSON.stringify(extractor));
  }

  const mineral = _(extractor.pos.lookFor(LOOK_MINERALS)).first();
  const terminal = _(findMyStructures(extractor.room).terminal).first();

  if (!mineral || mineral.ticksToRegeneration || !terminal) {
    return ERR_NOT_FOUND;
  }

  if (terminal.store[mineral.mineralType] > MINERAL_THRESHOLD * 2) {
    // とりあえずいっぱいあるときはいい
    return;
  }

  const { mineralHarvester = [], mineralCarrier = [] } = Object.values(Game.creeps)
    .filter((c) => c.memory.baseRoom === extractor.pos.roomName)
    .reduce(
      (groups, c) => {
        (groups[c.memory.role] = groups[c.memory.role] || []).push(c);
        return groups;
      },
      {} as Partial<Record<ROLES, Creeps[]>>,
    );

  // 最大匹数より少ないとき
  if (!(mineralHarvester as MineralHarvester[]).find((c) => c.memory.targetId === mineral.id)) {
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
  } else if ((mineralCarrier as MineralCarrier[]).length < 1) {
    const spawn = getSpawnsOrderdByRange(extractor, 1).first();
    if (!spawn) {
      console.log(`source ${extractor.id} can't find spawn`);
      return ERR_NOT_FOUND;
    }

    if (spawn.room.energyAvailable > 1000) {
      const name = `Mc_${extractor.room.name}_${Game.time}`;
      const spawned = spawn.spawnCreep(filterBodiesByCost("mineralCarrier", spawn.room.energyAvailable).bodies, name, {
        memory: {
          role: "mineralCarrier",
          baseRoom: extractor.room.name,
          mode: "🛒",
        } as MineralCarrierMemory,
      });
      return spawned;
    }
  }
  return OK;
}

function isE(s: Structure): s is StructureController {
  return s.structureType === STRUCTURE_EXTRACTOR;
}
