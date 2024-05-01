/// <reference types="screeps" />

declare type ROLES = "harvester";
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
}

/** 全部のCreepの型 */
declare type Creeps = Creep | Harvester;
declare interface Harvester extends Creep {
  memory: HarvesterMemory;
}

declare interface HarvesterMemory extends CreepMemory {
  role: "harvester";
  harvestTargetId: Source["id"];
  harvested?: ReturnType<Creep["harvest"]>;
}

declare type CreepBehavior = (creep: Creeps) => ScreepsReturnCode;
