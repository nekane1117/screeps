/// <reference types="screeps" />
declare interface RoomMemory {
  sources: Record<Id<Source>, SourceInfo>;
  creeps?: {
    tick: Game.time;
    value: Partial<Record<ROLES, Creeps[]>>;
  };
  spawns?: {
    tick: Game.time;
    value: StructureSpawn[];
  };
}

declare interface SourceInfo {
  // 周囲の地面の数
  spaces: number;
}
