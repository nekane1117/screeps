/// <reference types="screeps" />
declare interface RoomMemory {
  sources: Record<Id<Source>, SourceInfo>;
  creeps?: {
    tick: Game.time;
    value: Partial<Record<ROLES, string[]>>;
  };
  spawns?: {
    tick: Game.time;
    value: string[];
  };
}

declare interface SourceInfo {
  // 周囲の地面の数
  spaces: number;
}
