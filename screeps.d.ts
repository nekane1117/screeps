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
  /** 今何してるか
   * working    : 資源を持ってきてるところ
   * harvesting : 収集中
   */
  mode: "working" | "harvesting";
  harvestTargetId?: Source["id"] | null;
  storeId?: StoreTarget["id"] | null;
  harvested?: {
    tick: number;
    result: ReturnType<Creep["harvest"]>;
  };
}

declare interface RoomMemory {
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
  priorityConstructionTarget: Id<ConstructionSite>[];
}

declare interface Upgrader extends Creep {
  memory: UpgraderMemory;
}

declare interface UpgraderMemory extends HarvesterMemory {
  role: "upgrader";
  /** 今何してるか
   * working    : 作業中
   * collecting : 資源取得中
   * harvesting : 自力で収集中
   */
  mode: "working" | "collecting" | "harvesting";
  /** 資源をもらいに行く先 */
  storeId?: StoreTarget["id"] | null;
}

declare interface Builder extends Creep {
  memory: BuilderMemory;
}

declare interface BuilderMemory extends HarvesterMemory {
  role: "builder";
  /** 今何してるか
   * working    : 作業中
   * collecting : 資源取得中
   * harvesting : 自力で収集中
   */
  mode: "working" | "collecting" | "harvesting";
  /** 今建てたいもの */
  buildingId?: ConstructionSite["id"] | null;
  /** 資源をもらいに行く先 */
  storeId?: StoreTarget["id"] | null;
}
