/// <reference types="screeps" />

declare type ROLES = "harvester" | "carrier" | "builder" | "repairer" | "defender" | "upgrader";
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
  harvestMoved?: ReturnType<Creep["moveTo"]>;
}

/** 全部のCreepの型 */
declare type Creeps = Creep | Harvester | Upgrader | Builder | Carrier | Repairer;

declare type StoreTarget = StructureContainer | StructureSpawn | StructureExtension | StructureStorage | StructureLink;

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
  harvesterLimit: number;
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
}

declare interface Upgrader extends Creep {
  memory: UpgraderMemory;
}

declare interface UpgraderMemory extends HarvesterMemory {
  role: "upgrader";
  /** 今何してるか
   * working    : 作業中
   * collecting : 資源取得中
   */
  mode: "working" | "collecting";
  /** 資源をもらいに行く先 */
  storeId?: StoreTarget["id"] | null;

  collected?: ScreepsReturnCode;
}

declare interface Builder extends Creep {
  memory: BuilderMemory;
}

declare interface BuilderMemory extends HarvesterMemory {
  role: "builder";
  /** 今何してるか
   * working    : 作業中
   * collecting : 資源取得中
   */
  mode: "working" | "collecting";
  /** 今建てたいもの */
  buildingId?: ConstructionSite["id"] | null;
  built?: ReturnType<Creeps["build"]>;
  /** 資源をもらいに行く先 */
  storeId?: StoreTarget["id"] | null;
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
  transferId?: Id<Parameters<Creep["transfer"]>[0]>;
}

declare interface Repairer extends Creep {
  memory: RepairerMemory;
}

declare interface RepairerMemory extends HarvesterMemory {
  role: "repairer";
  /** 今何してるか
   * working    : 作業中
   * collecting : 資源取得中
   * harvesting : 自力で収集中
   */
  mode: "working" | "collecting" | "harvesting";
  /** 修理対象 */
  workTargetId?: Id<Structure> | null;
  /** 資源をもらいに行く先 */
  storeId?: StoreTarget["id"] | null;
  collected?: ScreepsReturnCode;
}
