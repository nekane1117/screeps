/// <reference types="screeps" />
declare interface RoomMemory {
  harvesterLimit: number;
  /** このtickでアクティブなソース */
  activeSource: Source["id"][];
  creeps?: {
    tick: number;
    names: string[];
  };
  spawns?: {
    tick: number;
    names: string[];
  };
  roadLayed: number;
}
