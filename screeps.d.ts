/// <reference types="screeps" />

declare type ROLES =
  | "harvester"
  | "carrier"
  | "builder"
  | "repairer"
  | "defender";
declare interface CreepMemory {
  role: ROLES;
}

/** 全部のCreepの型 */
declare type Creeps = Creep | Harvester;

declare type StoreTarget =
  | StructureContainer
  | StructureSpawn
  | StructureExtension
  | StructureStorage
  | StructureLink;

declare interface HarvesterMemory extends CreepMemory {
  role: "harvester";
}

declare interface Harvester extends Creep {
  memory: HarvesterMemory;
}

declare interface RoomMemory {
  /** このtickでアクティブなソース */
  activeSource: Source[];
}
