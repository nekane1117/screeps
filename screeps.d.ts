/// <reference types="screeps" />

declare type ROLES = "harvester" | "gatherer" | "builder" | "repairer" | "upgrader" | "distributer";
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
  moved?: ReturnType<Creep["moveTo"]>;
  harvestMoved?: ReturnType<Creep["moveTo"]>;
}

/** 全部のCreepの型 */
declare type Creeps = Creep | Harvester | Upgrader | Builder | Gatherer | Repairer;

declare type StoreTarget = StructureContainer | StructureSpawn | StructureExtension | StructureStorage | StructureLink;

declare interface Harvester extends Creep {
  memory: HarvesterMemory;
}

declare interface HarvesterMemory extends CreepMemory {
  role: "harvester";
  /** 今何してるか
   * 💪 : 資源を持ってきてるところ
   * 🌾 : 収集中
   */
  mode: "💪" | "🌾";
  harvestTargetId: Source["id"];
  storeId?: StoreTarget["id"] | null;
  harvested?: {
    tick: number;
    result: ReturnType<Creep["harvest"]>;
  };
}

declare type MyStructureCache = {
  all: Structure[];
  constructedWall: StructureWall[];
  container: StructureContainer[];
  controller: StructureController[];
  extension: StructureExtension[];
  extractor: StructureExtractor[];
  factory: StructureFactory[];
  invaderCore: StructureInvaderCore[];
  keeperLair: StructureKeeperLair[];
  lab: StructureLab[];
  link: StructureLink[];
  nuker: StructureNuker[];
  observer: StructureObserver[];
  portal: StructurePortal[];
  powerBank: StructurePowerBank[];
  powerSpawn: StructurePowerSpawn[];
  rampart: StructureRampart[];
  road: StructureRoad[];
  spawn: StructureSpawn[];
  storage: StructureStorage[];
  terminal: StructureTerminal[];
  tower: StructureTower[];
};

declare interface RoomMemory {
  creeps?: {
    tick: number;
    names: string[];
  };
  spawns?: {
    tick: number;
    names: string[];
  };
  roadLayed: number;

  find: {
    [FIND_STRUCTURES]?: MyStructureCache;
  };

  energySummary?: {
    production: number;
    consumes: number;
  }[];
}

declare interface Upgrader extends Creep {
  memory: UpgraderMemory;
}

declare interface UpgraderMemory extends CreepMemory {
  role: "upgrader";
  /** 今何してるか
   * working    : 作業中
   * collecting : 資源取得中
   */
  mode: "💪" | "🛒";
  /** 資源をもらいに行く先 */
  storeId?: StoreTarget["id"] | null;

  collected?: ScreepsReturnCode;
}

declare interface Builder extends Creep {
  memory: BuilderMemory;
}

declare interface BuilderMemory extends CreepMemory {
  role: "builder";
  /** 今何してるか
   * working    : 作業中
   * collecting : 資源取得中
   */
  mode: "💪" | "🛒";
  /** 今建てたいもの */
  buildingId?: ConstructionSite["id"] | null;
  built?: ReturnType<Creeps["build"]>;
  /** 資源をもらいに行く先 */
  storeId?: StoreTarget["id"] | null;
}

declare interface Gatherer extends Creep {
  memory: GathererMemory;
}

declare interface GathererMemory extends CreepMemory {
  role: "gatherer";
  /** 今何してるか
   * working    : 作業中
   * collecting : 資源取得中
   * harvesting : 自力で収集中
   */
  mode: "💪" | "🛒";
  /** 担当倉庫 */
  storeId?: Id<StructureExtension | StructureSpawn | StructureLink | StructureStorage | StructureTerminal | StructureContainer>;
  /** 配送先 */
  transferId?: Id<Parameters<Creep["transfer"]>[0]>;
}

declare interface Repairer extends Creep {
  memory: RepairerMemory;
}

/**
 * Source単位で固定で担当し、Spawnに向けて配布する
 */
declare interface Distributer extends Creep {
  memory: DistributerMemory;
}

declare interface DistributerMemory extends CreepMemory {
  role: "distributer";
  /** 今何してるか
   * 💪 : 作業中
   * 🛒 : 資源取得中
   */
  mode: "💪" | "🛒";
  /** 担当倉庫 */
  sourceId: Id<Source>;
  /** 配送先 */
  transferId?: Id<Parameters<Creep["transfer"]>[0]>;
}

declare interface Repairer extends Creep {
  memory: RepairerMemory;
}

declare interface RepairerMemory extends CreepMemory {
  role: "repairer";
  /** 今何してるか
   * working    : 作業中
   * collecting : 資源取得中
   * harvesting : 自力で収集中
   */
  mode: "💪" | "🛒" | "🌾";
  /** 修理対象 */
  workTargetId?: Id<Structure> | null;
  /** 資源をもらいに行く先 */
  storeId?: StoreTarget["id"] | null;
  collected?: ScreepsReturnCode;
}
