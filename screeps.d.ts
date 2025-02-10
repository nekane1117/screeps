/// <reference types="screeps" />

declare type ROLES =
  | "harvester"
  | "carrier"
  | "gatherer"
  | "builder"
  | "upgrader"
  | "claimer"
  | "mineralHarvester"
  | "mineralCarrier"
  | "defender"
  | "labManager"
  | "reserver"
  | "remoteHarvester"
  | "remoteCarrier";
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
declare type Creeps =
  | Creep
  | Harvester
  | Upgrader
  | Builder
  | Carrier
  | Claimer
  | MineralHarvester
  | MineralCarrier
  | Defender
  | LabManager
  | Reserver
  | RemoteHarvester
  | RemoteCarrier;

declare type StoreTarget = StructureContainer | StructureSpawn | StructureExtension | StructureStorage | StructureLink | StructureTerminal;

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
   * 🚛 : 資源を持ってきてるところ
   * 🌾 : 収集中
   */
  mode: "🚛" | "🌾";
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

  /** room names for remote harvest */
  remote?: string[];

  /** Measure carry size */
  carrySize?: Partial<{
    [r in ROLES]: number;
  }>;
  roadMap: number[];

  /** 固定で道路を置くところの配列 */
  staticRoad: { x: number; y: number }[];

  labMode: ROLES;
}

declare type CreepsCache = Partial<{
  builder: Builder[];
  carrier: Carrier[];
  claimer: Claimer[];
  defender: Defender[];
  gatherer: Gatherer[];
  harvester: Harvester[];
  labManager: LabManager[];
  mineralCarrier: MineralCarrier[];
  mineralHarvester: MineralHarvester[];
  remoteCarrier: RemoteCarrier[];
  remoteHarvester: RemoteHarvester[];
  reserver: Reserver[];
  upgrader: Upgrader[];
}> & {
  timestamp: number;
};

declare interface LabMemory {
  expectedType: MineralConstant | MineralCompoundConstant;
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
   * 👷 : 作業中
   * 🛒 : 資源取得中
   */
  mode: "👷" | "🛒";
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
   * harvesting : 自力で収集中
   */
  mode: "🚛" | "🛒";
  /** 担当倉庫 */
  storeId?: Id<StructureLink | StructureContainer | StructureStorage | StructureTerminal | StructureFactory>;
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
   * harvesting : 自力で収集中
   */
  mode: "🚛" | "🛒";

  /** 資源をもらいに行く先 */
  storeId?: Ruin["id"] | Tombstone["id"] | null;
}
declare interface MineralCarrier extends Creep {
  memory: MineralCarrierMemory;
}

declare interface MineralCarrierMemory extends CreepMemory {
  role: "mineralCarrier";
  /** 今何してるか
   * 🚛 : 輸送中
   * 🛒 : 資源取得中
   */
  mode: "🚛" | "🛒";
  /** 担当倉庫 */
  storeId?: Id<Parameters<Creeps["withdraw"]>[0] | Creep>;
  /** 配送先 */
  transferId?: Id<StructureContainer | StructureLab | StructureTerminal>;
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
  mode: "🛒" | "🚛";
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
  mode: "🚛" | "🛒";
  /** 担当倉庫 */
  storeId?: Id<StructureLab | StructureTerminal | StructureFactory | StructureStorage>;
  /** 担当倉庫 */
  mineralType?: ResourceConstant;
  /** 配送先 */
  transferId?: Id<Parameters<Creep["transfer"]>[0]>;
}

declare interface Reserver extends Creep {
  memory: ReserverMemory;
}

declare interface ReserverMemory extends CreepMemory {
  role: "reserver";
  targetRoomName: string;
  route?: ReturnType<(typeof Game)["map"]["findRoute"]>;
  exit?: RoomPosition | null;
}
declare interface RemoteHarvester extends Creep {
  memory: RemoteHarvesterMemory;
}

declare interface RemoteHarvesterMemory extends CreepMemory {
  role: "remoteHarvester";
  /** 今何してるか
   * 🚛 : 資源を持ってきてるところ
   * 🌾 : 収集中
   * 👷 : 建築中
   */
  mode: "🌾" | "👷";
  targetRoomName: string;
  harvestTargetId?: Source["id"] | null;
}
declare interface RemoteCarrier extends Creep {
  memory: RemoteCarrierMemory;
}

declare interface RemoteCarrierMemory extends CreepMemory {
  role: "remoteCarrier";
  mode: "🛒" | "🚛" | "👷";
  targetRoomName: string;
  siteId?: ConstructionSite["id"] | null;
  storeId?: Id<StructureContainer> | null;
  transferId?: StoreTarget["id"] | null;
}

declare interface Memory {
  factories: Record<Id<StructureFactory>, FactoryMemory>;
  terminals: Record<Id<StructureTerminal>, TerminalMemory>;
  do: boolean;
}

declare interface FactoryMemory {
  outputType?: ResourceConstant;
  expectedType?: ResourceConstant;
  lastProduced?: ResourceConstant;
}

declare interface TerminalMemory {
  lastTrade?: MarketResourceConstant;
}
