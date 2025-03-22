import { ObjectEntries, ObjectKeys } from "./utils.common";

export const TERMINAL_LIMIT = 10000;

export const COMMODITY_INGREDIENTS = _(ObjectEntries(COMMODITIES))
  .map(([key, value]) => {
    return [key, ...ObjectKeys(value.components)];
  })
  .flatten<ResourceConstant>()
  .uniq();

export const TRANSFER_THRESHOLD = 1000;

export const LAB_STRATEGY: Partial<Record<ROLES, AllMinerals>> = {
  builder: RESOURCE_CATALYZED_LEMERGIUM_ACID,
  mineralHarvester: RESOURCE_CATALYZED_UTRIUM_ALKALIDE,
  upgrader: RESOURCE_CATALYZED_GHODIUM_ACID,
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
  UH2O: ["UH", "OH"],
  UHO2: ["UO", "OH"],
  ZH2O: ["ZH", "OH"],
  ZHO2: ["ZO", "OH"],
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
