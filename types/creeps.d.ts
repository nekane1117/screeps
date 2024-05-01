/// <reference types="screeps" />

declare type ROLES = "harvester" | "upgrader";
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
declare type Creeps = Creep | Harvester | Upgrader;
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

declare type CreepBehavior = (creep: Creeps) => unknown;
