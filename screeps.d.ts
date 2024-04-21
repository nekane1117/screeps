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
declare type Creeps = Creep | Harvester | Upgrader | Builder;

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
  harvestTargetId?: Source["id"] | null;
}

declare interface RoomMemory {
  /** このtickでアクティブなソース */
  activeSource: Source["id"][];
  creeps?: {
    tick: number;
    names: string[];
  };
}

declare interface Upgrader extends Creep {
  memory: UpgraderMemory;
}

declare interface UpgraderMemory extends HarvesterMemory {
  role: "upgrader";
  upgrading?: boolean;
  /** 資源をもらいに行く先 */
  storeId?: StoreTarget["id"] | null;
}

declare interface Builder extends Creep {
  memory: BuilderMemory;
}

declare interface BuilderMemory extends HarvesterMemory {
  role: "builder";
  /** 建築中？ */
  building?: boolean;
  /** 今建てたいもの */
  buildingId?: ConstructionSite["id"] | null;
  /** 資源をもらいに行く先 */
  storeId?: StoreTarget["id"] | null;
}
