/// <reference types="screeps" />

declare type ROLES = "harvester" | "upgrader" | "carrier";
declare interface CreepMemory {
  role: ROLES;
  // 担当作業の作業結果
  worked?: ScreepsReturnCode;
  _move?: {
    dest: { x: number; y: number; room: string };
    time: typeof Game.time;
    path: PathStep[];
    room: string;
  };
  targetId: Id;
}

/** 全部のCreepの型 */
declare type Creeps = Creep | Harvester | Upgrader | Carrier;
declare interface Harvester extends Creep {
  memory: HarvesterMemory;
}

declare interface HarvesterMemory extends CreepMemory {
  role: "harvester";
  harvestTargetId: Source["id"];
}

declare interface Upgrader extends Creep {
  memory: UpgraderMemory;
}

declare interface UpgraderMemory extends CreepMemory {
  role: "upgrader";
  mode: "collecting" | "working";
  storeId: Id<StoreTarget> | null | undefined;
}

declare interface Carrier extends Creep {
  memory: CarrierMemory;
}

declare interface CarrierMemory extends HarvesterMemory {
  role: "carrier";
  /** 今何してるか
   * working    : 作業中
   * collecting : 資源取得中
   * harvesting : 自力で収集中
   */
  mode: "working" | "collecting";
  /** 担当倉庫 */
  storeId: StructureContainer["id"];
  /** 配送先 */
  transferId?: Id<Structure> | null;
}

declare type CreepBehavior = (creep: Creeps) => unknown;
