/// <reference types="screeps" />
declare interface RoomMemory {
  sources: SourceInfo[];
}

declare interface SourceInfo {
  // 周囲の地面の数
  spaces: number;
}
