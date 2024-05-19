/// <reference types="screeps" />

declare interface SourceMemory {
  /** 使える場所の数 */
  positions: number;
}

declare type ROLES = "harvester" | "carrier" | "builder" | "upgrader" | "claimer";
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
declare type Creeps = Creep | Harvester | Upgrader | Builder | Carrier | Repairer | Claimer;

declare type StoreTarget = StructureContainer | StructureSpawn | StructureExtension | StructureStorage | StructureLink;

declare type HasStore =
  | StructureExtension
  | StructureSpawn
  | StructureLink
  | StructureStorage
  | StructureTower
  | StructurePowerSpawn
  | StructureLab
  | StructureTerminal
  | StructureContainer
  | StructureNuker
  | StructureFactory;

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
  all: AnyStructure[];
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

  mainSpawn?: Id<StructureSpawn>;
  sources: Record<Id[Source], SourceMemory>;

  roadLayed: number;

  find: {
    [FIND_STRUCTURES]?: MyStructureCache;
  };

  energySummary?: {
    time: number;
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
  parentRoom: string;
}

declare interface Carrier extends Creep {
  memory: CarrierMemory;
}

declare interface CarrierMemory extends CreepMemory {
  role: "carrier";
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

declare interface Claimer extends Creep {
  memory: ClaimerMemory;
}

declare interface ClaimerMemory extends CreepMemory {
  role: "claimer";
  flagName: string;
}
