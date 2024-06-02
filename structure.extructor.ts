import { TERMINAL_THRESHOLD } from "./constants";
import { filterBodiesByCost, getCarrierBody } from "./util.creep";
import { findMyStructures, getSpawnsInRoom, getSpawnsOrderdByRange } from "./utils";

export default function behavior(extractor: Structure) {
  if (!isE(extractor)) {
    return console.log("type is invalid", JSON.stringify(extractor));
  }

  const mineral = _(extractor.pos.lookFor(LOOK_MINERALS)).first();
  const terminal = _(findMyStructures(extractor.room).terminal).first();

  if (!mineral || mineral.ticksToRegeneration || !terminal) {
    return ERR_NOT_FOUND;
  }

  if (terminal.store[mineral.mineralType] > TERMINAL_THRESHOLD * 2) {
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
  if (
    (extractor.room.terminal?.store.energy || 0) > extractor.room.energyCapacityAvailable &&
    !(mineralHarvester as MineralHarvester[]).find((c) => c.memory.targetId === mineral.id)
  ) {
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
  } else if ((extractor.room.terminal?.store.energy || 0) > extractor.room.energyCapacityAvailable && (mineralCarrier as MineralCarrier[]).length < 1) {
    const spawn = _(getSpawnsInRoom(extractor.room))
      .filter((s) => !s.spawning)
      .first();
    if (!spawn) {
      console.log(`source ${extractor.id} can't find spawn`);
      return ERR_NOT_FOUND;
    }

    if (extractor.room.energyAvailable >= extractor.room.energyCapacityAvailable) {
      const name = `Mc_${extractor.room.name}_${Game.time}`;
      const spawned = spawn.spawnCreep(getCarrierBody(extractor.room, "mineralCarrier"), name, {
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
