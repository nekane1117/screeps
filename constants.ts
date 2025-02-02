import { ObjectKeys } from "./utils.common";

export const TERMINAL_LIMIT = 10000;

export const TERMINAL_THRESHOLD = 1000;

type AllMinerals = MineralConstant | MineralCompoundConstant;

export const LAB_STRATEGY: Partial<Record<MineralConstant, AllMinerals[]>> = {
  [RESOURCE_LEMERGIUM]: [
    RESOURCE_LEMERGIUM,
    RESOURCE_HYDROGEN,
    RESOURCE_LEMERGIUM_HYDRIDE,
    RESOURCE_OXYGEN,
    RESOURCE_HYDROXIDE,
    RESOURCE_LEMERGIUM_ACID,
    RESOURCE_CATALYST,
    RESOURCE_CATALYZED_LEMERGIUM_ACID,
  ],
  [RESOURCE_OXYGEN]: [
    RESOURCE_LEMERGIUM,
    RESOURCE_HYDROGEN,
    RESOURCE_LEMERGIUM_HYDRIDE,
    RESOURCE_OXYGEN,
    RESOURCE_HYDROXIDE,
    RESOURCE_LEMERGIUM_ACID,
    RESOURCE_CATALYST,
    RESOURCE_CATALYZED_LEMERGIUM_ACID,
  ],
  [RESOURCE_HYDROGEN]: [
    RESOURCE_LEMERGIUM,
    RESOURCE_HYDROGEN,
    RESOURCE_LEMERGIUM_HYDRIDE,
    RESOURCE_OXYGEN,
    RESOURCE_HYDROXIDE,
    RESOURCE_LEMERGIUM_ACID,
    RESOURCE_CATALYST,
    RESOURCE_CATALYZED_LEMERGIUM_ACID,
  ],
  [RESOURCE_UTRIUM]: [
    RESOURCE_UTRIUM,
    RESOURCE_HYDROGEN,
    RESOURCE_UTRIUM_HYDRIDE,
    RESOURCE_OXYGEN,
    RESOURCE_HYDROXIDE,
    RESOURCE_UTRIUM_ACID,
    RESOURCE_CATALYST,
    RESOURCE_CATALYZED_UTRIUM_ACID,
  ],
};

export const REVERSE_REACTIONS: Record<AllMinerals, [AllMinerals, AllMinerals] | undefined> = {
  GH: ["G", "H"],
  GO: ["G", "O"],
  GH2O: ["GH", "OH"],
  XGH2O: ["GH2O", "X"],
  XGHO2: ["GHO2", "X"],
  GHO2: ["GO", "OH"],
  KH: ["H", "K"],
  LH: ["H", "L"],
  OH: ["H", "O"],
  UH: ["H", "U"],
  ZH: ["H", "Z"],
  KO: ["K", "O"],
  ZK: ["K", "Z"],
  KH2O: ["KH", "OH"],
  XKH2O: ["KH2O", "X"],
  XKHO2: ["KHO2", "X"],
  KHO2: ["KO", "OH"],
  LO: ["L", "O"],
  UL: ["L", "U"],
  LH2O: ["LH", "OH"],
  XLH2O: ["LH2O", "X"],
  XLHO2: ["LHO2", "X"],
  LHO2: ["LO", "OH"],
  UO: ["O", "U"],
  ZO: ["O", "Z"],
  UH2O: ["OH", "UH"],
  UHO2: ["OH", "UO"],
  ZH2O: ["OH", "ZH"],
  ZHO2: ["OH", "ZO"],
  XUH2O: ["UH2O", "X"],
  XUHO2: ["UHO2", "X"],
  G: ["UL", "ZK"],
  XZH2O: ["X", "ZH2O"],
  XZHO2: ["X", "ZHO2"],
  H: undefined,
  K: undefined,
  L: undefined,
  O: undefined,
  U: undefined,
  X: undefined,
  Z: undefined,
};

export const ALL_REACTIONS = _(ObjectKeys(REVERSE_REACTIONS)).sortBy((r) => (r === "G" ? 0 : r.length));

export const ROAD_DECAY_AMOUNT_SWAMP = 500;
export const ROAD_DECAY_AMOUNT_WALL = 15000;

/**
 * 展開処理
 */
export const DECOMPRESSING_COMMODITIES: ResourceConstant[] = [
  RESOURCE_UTRIUM,
  RESOURCE_LEMERGIUM,
  RESOURCE_ZYNTHIUM,
  RESOURCE_KEANIUM,
  RESOURCE_GHODIUM,
  RESOURCE_OXYGEN,
  RESOURCE_HYDROGEN,
  RESOURCE_CATALYST,
  RESOURCE_ENERGY,
];

type CompressiongIngredient = Partial<
  Record<
    ResourceConstant,
    {
      type: ResourceConstant;
      rate: number;
    }
  >
>;

/** 原材料換算表 複数原材料があるやつはどうしようか */
export const COMPRESSING_INGREDIENT: CompressiongIngredient = {
  [RESOURCE_UTRIUM_BAR]: { type: RESOURCE_UTRIUM, rate: 5 },
  [RESOURCE_LEMERGIUM_BAR]: { type: RESOURCE_LEMERGIUM, rate: 5 },
  [RESOURCE_ZYNTHIUM_BAR]: { type: RESOURCE_ZYNTHIUM, rate: 5 },
  [RESOURCE_KEANIUM_BAR]: { type: RESOURCE_KEANIUM, rate: 5 },
  [RESOURCE_GHODIUM_MELT]: { type: RESOURCE_GHODIUM, rate: 5 },
  [RESOURCE_OXIDANT]: { type: RESOURCE_OXYGEN, rate: 5 },
  [RESOURCE_REDUCTANT]: { type: RESOURCE_HYDROGEN, rate: 5 },
  [RESOURCE_PURIFIER]: { type: RESOURCE_CATALYST, rate: 5 },
  // エネルギー量換算しないといけないので一旦スルー
  // [RESOURCE_BATTERY]: { type: RESOURCE_ENERGY, rate: 12 },
};
