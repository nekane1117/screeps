/// <reference types="screeps" />
declare type ROLES = "harvester" | "carrier" | "gatherer" | "builder" | "upgrader" | "claimer" | "mineralHarvester" | "defender" | "labManager";
declare interface CreepMemory {
  role: ROLES;
  baseRoom: string;
  // 担当作業の作業結果
  worked?: ScreepsReturnCode;
  _move?: {
    dest: { x: number; y: number; room: string };
    time: typeof Game.time;
    path: PathStep[];
    room: string;
  };
  moved?: ReturnType<Creep["moveTo"]>;

  __moveRoom?: {
    route?: ReturnType<(typeof Game)["map"]["findRoute"]>;
    exit?: RoomPosition | null;
  };
  __avoidCreep: boolean;
}

/** 全部のCreepの型 */
declare type Creeps = Creep | Harvester | Upgrader | Builder | Carrier | Claimer | MineralHarvester | Defender | LabManager;

declare type StoreTarget = StructureContainer | StructureSpawn | StructureExtension | StructureStorage | StructureLink | StructureTerminal | StructureFactory;

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
   * D : 資源を持ってきてるところ
   * H : 収集中
   */
  mode: "D" | "H";
  harvestTargetId?: Source["id"];
  transferId?: Id<HasStore> | null;
}

declare type MyStructureCache = {
  all: AnyStructure[];
  constructedWall: StructureWall[];
  container: StructureContainer[];
  controller: StructureController | undefined;
  extension: StructureExtension[];
  extractor: StructureExtractor | undefined;
  factory: StructureFactory | undefined;
  invaderCore: StructureInvaderCore[];
  keeperLair: StructureKeeperLair[];
  lab: StructureLab[];
  link: StructureLink[];
  nuker: StructureNuker | undefined;
  observer: StructureObserver | undefined;
  portal: StructurePortal[];
  powerBank: StructurePowerBank[];
  powerSpawn: StructurePowerSpawn | undefined;
  rampart: StructureRampart[];
  road: StructureRoad[];
  spawn: StructureSpawn[];
  storage: StructureStorage | undefined;
  terminal: StructureTerminal | undefined;
  tower: StructureTower[];
  source: Source[];
};

declare interface ControllerMemory {
  latch?: boolean;
}

declare interface RoomMemory {
  creeps?: CreepsCache;

  mainSpawn?: Id<StructureSpawn>;

  roadLayed: number;

  find?: {
    [FIND_STRUCTURES]?: {
      time: number;
      data: MyStructureCache;
    };
    [FIND_SOURCES]?: {
      time: number;
      data: Id<Source>[];
    };
  };

  labs: Partial<Record<Id<StructureLab>, LabMemory>>;

  /** Measure carry size */
  carrySize?: Partial<{
    [r in ROLES]: number;
  }>;
  roadMap: number[];

  /** 固定で道路を置くところの配列 */
  staticRoad: { x: number; y: number }[];

  labMode: ROLES;

  controller: ControllerMemory;
}

declare type CreepsCache = Partial<{
  builder: Builder[];
  carrier: Carrier[];
  claimer: Claimer[];
  defender: Defender[];
  gatherer: Gatherer[];
  harvester: Harvester[];
  labManager: LabManager[];
  mineralHarvester: MineralHarvester[];
  upgrader: Upgrader[];
}> & {
  timestamp: number;
};

declare type AllMinerals = MineralConstant | MineralCompoundConstant;

declare interface LabMemory {
  expectedType: AllMinerals | undefined;
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
  mode: "W" | "G";
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
   * W : 作業中
   * G : 資源取得中
   */
  mode: "W" | "G";
  /** 今建てたいもの */
  buildingId?: ConstructionSite["id"] | null;
  transferId?: AnyStoreStructure["id"] | null;
  built?: ReturnType<Creeps["build"]>;
  /** 修理するもの */
  repairId?: Id<Parameters<Creep["repair"]>[0]>;
  /** 応急手当が要るもの */
  firstAidId?: Id<Parameters<Creep["repair"]>[0]>;
  built?: ReturnType<Creeps["build"]>;
  /** 資源をもらいに行く先 */
  storeId?: Id<AnyStoreStructure>;
}

declare interface Carrier extends Creep {
  memory: CarrierMemory;
}

declare interface CarrierMemory extends CreepMemory {
  role: "carrier";
  /** 今何してるか
   * working    : 作業中
   * collecting : 資源取得中
   * H : 自力で収集中
   */
  mode: "D" | "G";
  /** 担当倉庫 */
  storeId?: Id<StructureLink | StructureContainer | StructureStorage | StructureTerminal | StructureFactory | Resource | Tombstone | Ruin>;
  /** 配送先 */
  transferId?: Id<Parameters<Creep["transfer"]>[0]>;
}
declare interface Gatherer extends Creep {
  memory: GathererMemory;
}

declare interface GathererMemory extends CreepMemory {
  role: "gatherer";
  /** 今何してるか
   * working    : 作業中
   * collecting : 資源取得中
   * H : 自力で収集中
   */
  mode: "D" | "G";

  /** 資源をもらいに行く先 */
  storeId?: Ruin["id"] | Tombstone["id"] | Id<HasStore> | null;

  /** 解体対象 */
  dismantleId?: Id<Parameters<Creep["dismantle"]>[0]>;
}
declare interface Claimer extends Creep {
  memory: ClaimerMemory;
}

declare interface ClaimerMemory extends CreepMemory {
  role: "claimer";
  flagName: string;
}

declare interface MineralHarvester extends Creep {
  memory: MineralHarvesterMemory;
}

declare interface MineralHarvesterMemory extends CreepMemory {
  mode: "G" | "D";
  role: "mineralHarvester";
  pickUpId: Id<Resource> | undefined;
  targetId: Id<Mineral>;
  storeId?: Id<Parameters<Creep["transfer"]>[0]>;
}

declare interface Defender extends Creep {
  memory: DefenderMemory;
}
declare interface DefenderMemory extends CreepMemory {
  role: "defender";
  targetId?: Id<AnyCreep> | Id<Structure>;
}

declare interface LabManager extends Creep {
  memory: LabManagerMemory;
}

declare interface LabManagerMemory extends CreepMemory {
  role: "labManager";
  /** 今何してるか
   * working    : 作業中
   * collecting : 資源取得中
   */
  mode: "D" | "G";
  /** 担当倉庫 */
  storeId?: Id<StructureLab | StructureTerminal | StructureFactory | StructureStorage>;
  /** 担当倉庫 */
  mineralType?: ResourceConstant;
  /** 配送先 */
  transferId?: Id<Parameters<Creep["transfer"]>[0]>;

  balancing?: boolean;
}
declare interface Memory {
  factories: Record<Id<StructureFactory>, FactoryMemory>;
  terminals: Record<Id<StructureTerminal>, TerminalMemory>;
  do: boolean;
}

declare interface FactoryMemory {
  lastProduced?: ResourceConstant;
}

declare interface TerminalMemory {
  lastTrade?: MarketResourceConstant;
  lastTradeResult?: ScreepsReturnCode;
  lastTradeTick?: number;
  paritId?: Id<StructureTerminal>;
}

declare type CreepBehavior = (creep: Creeps) => void;
