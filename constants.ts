export const MINERAL_THRESHOLD = 10000;

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
  [RESOURCE_OXYGEN]: [RESOURCE_OXYGEN, RESOURCE_HYDROGEN, RESOURCE_HYDROXIDE],
  [RESOURCE_HYDROGEN]: [RESOURCE_OXYGEN, RESOURCE_HYDROGEN, RESOURCE_HYDROXIDE],
};

export const REVERSE_REACTIONS: Record<MineralConstant | MineralCompoundConstant, [AllMinerals, AllMinerals] | undefined> = {
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

export const DECAY = {
  [STRUCTURE_ROAD]: ROAD_DECAY_AMOUNT,
  [STRUCTURE_RAMPART]: RAMPART_DECAY_AMOUNT,
  [STRUCTURE_CONTAINER]: CONTAINER_DECAY,
};
