/// <reference types="screeps" />

declare type ROLES =
  | "harvester"
  | "carrier"
  | "builder"
  | "repairer"
  | "defender"
  | "upgrader";
declare interface CreepMemory {
  role: ROLES;
}

/** 全部のCreepの型 */
declare type Creeps = Creep | Harvester | Upgrader;

declare type StoreTarget =
  | StructureContainer
  | StructureSpawn
  | StructureExtension
  | StructureStorage
  | StructureLink;

declare interface Harvester extends Creep {
  memory: HarvesterMemory;
}

declare interface HarvesterMemory extends CreepMemory {
  role: "harvester";
  target?: Source["id"] | null;
}

declare interface RoomMemory {
  /** このtickでアクティブなソース */
  activeSource: Source["id"][];
}

declare interface Upgrader extends Creep {
  memory: UpgraderMemory;
}

declare interface UpgraderMemory extends CreepMemory {
  role: "upgrader";
  upgrading?: boolean;
  /** 資源をもらいに行く先 */
  targetId?: StoreTarget["id"] | null;
}
