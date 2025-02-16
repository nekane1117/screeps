import { getCreepsInRoom } from "./util.creep";
import { findMyStructures, getLabs } from "./utils";

export function defaultTo<T>(value: T | null | undefined, defaultValue: T) {
  if (value === undefined || value === null) {
    return defaultValue;
  } else {
    return value;
  }
}

export function ObjectKeys<T extends object>(o: T): (keyof T)[] {
  return Object.keys(o) as (keyof T)[];
}
export function ObjectEntries<T extends object>(o: T): [keyof T, T[keyof T]][] {
  return Object.entries(o) as [keyof T, T[keyof T]][];
}

let allResouces: Partial<
  Record<
    string,
    Partial<Record<ResourceConstant, number>> & {
      timestamp: number;
    }
  >
> = {};

export function getRoomResouces(room: Room) {
  allResouces = allResouces || {};

  let roomResouces = allResouces[room.name];

  if (roomResouces && roomResouces.timestamp === Game.time) {
    return roomResouces;
  }

  roomResouces = allResouces[room.name] = {
    timestamp: Game.time,
  };

  const { factory } = findMyStructures(room);
  for (const storage of _.compact([room.storage, room.terminal, factory, ...getLabs(room).run(), ...(getCreepsInRoom(room).labManager || [])])) {
    for (const resource of RESOURCES_ALL) {
      roomResouces[resource] = (roomResouces[resource] || 0) + (storage.store.getUsedCapacity(resource) ?? 0);
    }
  }
  return roomResouces;
}

export function isCommodity(
  x: unknown,
): x is Exclude<keyof typeof COMMODITIES, RESOURCE_ENERGY | RESOURCE_UTRIUM | RESOURCE_KEANIUM | RESOURCE_ZYNTHIUM | RESOURCE_LEMERGIUM> {
  return (
    ObjectKeys(COMMODITIES)
      .filter((key) => {
        return key !== RESOURCE_ENERGY && key !== RESOURCE_UTRIUM && key !== RESOURCE_KEANIUM && key !== RESOURCE_ZYNTHIUM && key !== RESOURCE_LEMERGIUM;
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .includes(x as any)
  );
}
