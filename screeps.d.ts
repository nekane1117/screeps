/// <reference types="screeps" />

declare interface SourceMemory {
  /** 使える場所の数 */
  positions: number;
}

declare type ROLES =
  | "harvester"
  | "carrier"
  | "builder"
  | "repairer"
  | "upgrader"
  | "claimer"
  | "mineralHarvester"
  | "mineralCarrier"
  | "defender"
  | "labManager"
  | "reserver"
  | "remoteHarvester";
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
}

/** 全部のCreepの型 */
declare type Creeps =
  | Creep
  | Harvester
  | Upgrader
  | Builder
  | Carrier
  | Repairer
  | Claimer
  | MineralHarvester
  | MineralCarrier
  | Defender
  | LabManager
  | Reserver
  | RemoteHarvester;

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
declare interface Memory {
  realTImes: (
    | {
        time: number;
        unixTime: number;
      }
    | number
  )[];
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

  /** room names for remote harvest */
  remote?: string[];

  /** Measure carry size */
  carrySize: {
    [r in ROLES]: number;
  };
  roadMap: number[];
  dismantle?: Id<Structure>[];
}

declare type CreepsCache = Partial<{
  harvester: Harvester[];
  carrier: Carrier[];
  builder: Builder[];
  repairer: Repairer[];
  upgrader: Upgrader[];
  claimer: Claimer[];
  mineralHarvester: MineralHarvester[];
  mineralCarrier: MineralCarrier[];
  defender: Defender[];
  labManager: LabManager[];
  reserver: Reserver[];
  remoteHarvester: RemoteHarvester[];
}>;

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
  built?: ReturnType<Creeps["build"]>;
  /** 修理するもの */
  repairId?: Id<Parameters<Creep["repair"]>[0]>;
  /** 応急手当が要るもの */
  firstAidId?: Id<Parameters<Creep["repair"]>[0]>;
  built?: ReturnType<Creeps["build"]>;
  /** 資源をもらいに行く先 */
  storeId?: Id<Parameters<Creep["withdraw"]>[0]>;
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
  storeId?: Id<StructureExtension | StructureSpawn | StructureLink | StructureStorage | StructureTerminal | StructureContainer>;
  /** 配送先 */
  transferId?: Id<Parameters<Creep["transfer"]>[0]>;
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

declare interface Repairer extends Creep {
  memory: RepairerMemory;
}
declare interface RepairerMemory extends CreepMemory {
  role: "repairer";
  mode: "🔧" | "🛒";
  targetId?: Id<Structure>;
  storeId?: StoreTarget["id"] | null;
  towerId?: Id<StructureTower> | null;
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
  role: "mineralHarvester";
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
  storeId?: Id<StructureLab | StructureTerminal>;
  /** 担当倉庫 */
  mineralType?: MineralConstant | MineralCompoundConstant;
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
  mode: "🚛" | "🌾" | "👷";
  targetRoomName: string;
  harvestTargetId?: Source["id"] | null;
  siteId?: ConstructionSite["id"] | null;
  exit?: RoomPosition | null;
  route?: ReturnType<(typeof Game)["map"]["findRoute"]>;
  storeId?: StoreTarget["id"] | null;
}
