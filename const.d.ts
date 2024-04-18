declare let OK: 0;
declare let ERR_NOT_OWNER: -1;
declare let ERR_NO_PATH: -2;
declare let ERR_NAME_EXISTS: -3;
declare let ERR_BUSY: -4;
declare let ERR_NOT_FOUND: -5;
declare let ERR_NOT_ENOUGH_ENERGY: -6;
declare let ERR_NOT_ENOUGH_RESOURCES: -6;
declare let ERR_INVALID_TARGET: -7;
declare let ERR_FULL: -8;
declare let ERR_NOT_IN_RANGE: -9;
declare let ERR_INVALID_ARGS: -10;
declare let ERR_TIRED: -11;
declare let ERR_NO_BODYPART: -12;
declare let ERR_NOT_ENOUGH_EXTENSIONS: -6;
declare let ERR_RCL_NOT_ENOUGH: -14;
declare let ERR_GCL_NOT_ENOUGH: -15;
declare let FIND_EXIT_TOP: 1;
declare let FIND_EXIT_RIGHT: 3;
declare let FIND_EXIT_BOTTOM: 5;
declare let FIND_EXIT_LEFT: 7;
declare let FIND_EXIT: 10;
declare let FIND_CREEPS: 101;
declare let FIND_MY_CREEPS: 102;
declare let FIND_HOSTILE_CREEPS: 103;
declare let FIND_SOURCES_ACTIVE: 104;
declare let FIND_SOURCES: 105;
declare let FIND_DROPPED_RESOURCES: 106;
declare let FIND_STRUCTURES: 107;
declare let FIND_MY_STRUCTURES: 108;
declare let FIND_HOSTILE_STRUCTURES: 109;
declare let FIND_FLAGS: 110;
declare let FIND_CONSTRUCTION_SITES: 111;
declare let FIND_MY_SPAWNS: 112;
declare let FIND_HOSTILE_SPAWNS: 113;
declare let FIND_MY_CONSTRUCTION_SITES: 114;
declare let FIND_HOSTILE_CONSTRUCTION_SITES: 115;
declare let FIND_MINERALS: 116;
declare let FIND_NUKES: 117;
declare let FIND_TOMBSTONES: 118;
declare let FIND_POWER_CREEPS: 119;
declare let FIND_MY_POWER_CREEPS: 120;
declare let FIND_HOSTILE_POWER_CREEPS: 121;
declare let FIND_DEPOSITS: 122;
declare let FIND_RUINS: 123;
declare let TOP: 1;
declare let TOP_RIGHT: 2;
declare let RIGHT: 3;
declare let BOTTOM_RIGHT: 4;
declare let BOTTOM: 5;
declare let BOTTOM_LEFT: 6;
declare let LEFT: 7;
declare let TOP_LEFT: 8;
declare let COLOR_RED: 1;
declare let COLOR_PURPLE: 2;
declare let COLOR_BLUE: 3;
declare let COLOR_CYAN: 4;
declare let COLOR_GREEN: 5;
declare let COLOR_YELLOW: 6;
declare let COLOR_ORANGE: 7;
declare let COLOR_BROWN: 8;
declare let COLOR_GREY: 9;
declare let COLOR_WHITE: 10;
declare let LOOK_CREEPS: "creep";
declare let LOOK_ENERGY: "energy";
declare let LOOK_RESOURCES: "resource";
declare let LOOK_SOURCES: "source";
declare let LOOK_MINERALS: "mineral";
declare let LOOK_DEPOSITS: "deposit";
declare let LOOK_STRUCTURES: "structure";
declare let LOOK_FLAGS: "flag";
declare let LOOK_CONSTRUCTION_SITES: "constructionSite";
declare let LOOK_NUKES: "nuke";
declare let LOOK_TERRAIN: "terrain";
declare let LOOK_TOMBSTONES: "tombstone";
declare let LOOK_POWER_CREEPS: "powerCreep";
declare let LOOK_RUINS: "ruin";
declare let OBSTACLE_OBJECT_TYPES: [
  "spawn",
  "creep",
  "powerCreep",
  "source",
  "mineral",
  "deposit",
  "controller",
  "constructedWall",
  "extension",
  "link",
  "storage",
  "tower",
  "observer",
  "powerSpawn",
  "powerBank",
  "lab",
  "terminal",
  "nuker",
  "factory",
  "invaderCore",
];
declare let MOVE: "move";
declare let WORK: "work";
declare let CARRY: "carry";
declare let ATTACK: "attack";
declare let RANGED_ATTACK: "ranged_attack";
declare let TOUGH: "tough";
declare let HEAL: "heal";
declare let CLAIM: "claim";
declare let BODYPART_COST: {
  move: 50;
  work: 100;
  attack: 80;
  carry: 50;
  heal: 250;
  ranged_attack: 150;
  tough: 10;
  claim: 600;
};
declare let WORLD_WIDTH: 202;
declare let WORLD_HEIGHT: 202;
declare let CREEP_LIFE_TIME: 1500;
declare let CREEP_CLAIM_LIFE_TIME: 600;
declare let CREEP_CORPSE_RATE: 0.2;
declare let CREEP_PART_MAX_ENERGY: 125;
declare let CARRY_CAPACITY: 50;
declare let HARVEST_POWER: 2;
declare let HARVEST_MINERAL_POWER: 1;
declare let HARVEST_DEPOSIT_POWER: 1;
declare let REPAIR_POWER: 100;
declare let DISMANTLE_POWER: 50;
declare let BUILD_POWER: 5;
declare let ATTACK_POWER: 30;
declare let UPGRADE_CONTROLLER_POWER: 1;
declare let RANGED_ATTACK_POWER: 10;
declare let HEAL_POWER: 12;
declare let RANGED_HEAL_POWER: 4;
declare let REPAIR_COST: 0.01;
declare let DISMANTLE_COST: 0.005;
declare let RAMPART_DECAY_AMOUNT: 300;
declare let RAMPART_DECAY_TIME: 100;
declare let RAMPART_HITS: 1;
declare let RAMPART_HITS_MAX: {
  2: 300000;
  3: 1000000;
  4: 3000000;
  5: 10000000;
  6: 30000000;
  7: 100000000;
  8: 300000000;
};
declare let ENERGY_REGEN_TIME: 300;
declare let ENERGY_DECAY: 1000;
declare let SPAWN_HITS: 5000;
declare let SPAWN_ENERGY_START: 300;
declare let SPAWN_ENERGY_CAPACITY: 300;
declare let CREEP_SPAWN_TIME: 3;
declare let SPAWN_RENEW_RATIO: 1.2;
declare let SOURCE_ENERGY_CAPACITY: 3000;
declare let SOURCE_ENERGY_NEUTRAL_CAPACITY: 1500;
declare let SOURCE_ENERGY_KEEPER_CAPACITY: 4000;
declare let WALL_HITS: 1;
declare let WALL_HITS_MAX: 300000000;
declare let EXTENSION_HITS: 1000;
declare let EXTENSION_ENERGY_CAPACITY: {
  0: 50;
  1: 50;
  2: 50;
  3: 50;
  4: 50;
  5: 50;
  6: 50;
  7: 100;
  8: 200;
};
declare let ROAD_HITS: 5000;
declare let ROAD_WEAROUT: 1;
declare let ROAD_WEAROUT_POWER_CREEP: 100;
declare let ROAD_DECAY_AMOUNT: 100;
declare let ROAD_DECAY_TIME: 1000;
declare let LINK_HITS: 1000;
declare let LINK_HITS_MAX: 1000;
declare let LINK_CAPACITY: 800;
declare let LINK_COOLDOWN: 1;
declare let LINK_LOSS_RATIO: 0.03;
declare let STORAGE_CAPACITY: 1000000;
declare let STORAGE_HITS: 10000;
declare let STRUCTURE_SPAWN: "spawn";
declare let STRUCTURE_EXTENSION: "extension";
declare let STRUCTURE_ROAD: "road";
declare let STRUCTURE_WALL: "constructedWall";
declare let STRUCTURE_RAMPART: "rampart";
declare let STRUCTURE_KEEPER_LAIR: "keeperLair";
declare let STRUCTURE_PORTAL: "portal";
declare let STRUCTURE_CONTROLLER: "controller";
declare let STRUCTURE_LINK: "link";
declare let STRUCTURE_STORAGE: "storage";
declare let STRUCTURE_TOWER: "tower";
declare let STRUCTURE_OBSERVER: "observer";
declare let STRUCTURE_POWER_BANK: "powerBank";
declare let STRUCTURE_POWER_SPAWN: "powerSpawn";
declare let STRUCTURE_EXTRACTOR: "extractor";
declare let STRUCTURE_LAB: "lab";
declare let STRUCTURE_TERMINAL: "terminal";
declare let STRUCTURE_CONTAINER: "container";
declare let STRUCTURE_NUKER: "nuker";
declare let STRUCTURE_FACTORY: "factory";
declare let STRUCTURE_INVADER_CORE: "invaderCore";
declare let CONSTRUCTION_COST: {
  spawn: 15000;
  extension: 3000;
  road: 300;
  constructedWall: 1;
  rampart: 1;
  link: 5000;
  storage: 30000;
  tower: 5000;
  observer: 8000;
  powerSpawn: 100000;
  extractor: 5000;
  lab: 50000;
  terminal: 100000;
  container: 5000;
  nuker: 100000;
  factory: 100000;
};
declare let CONSTRUCTION_COST_ROAD_SWAMP_RATIO: 5;
declare let CONSTRUCTION_COST_ROAD_WALL_RATIO: 150;
declare let CONTROLLER_LEVELS: {
  1: 200;
  2: 45000;
  3: 135000;
  4: 405000;
  5: 1215000;
  6: 3645000;
  7: 10935000;
};
declare let CONTROLLER_STRUCTURES: {
  spawn: { 0: 0; 1: 1; 2: 1; 3: 1; 4: 1; 5: 1; 6: 1; 7: 2; 8: 3 };
  extension: { 0: 0; 1: 0; 2: 5; 3: 10; 4: 20; 5: 30; 6: 40; 7: 50; 8: 60 };
  link: { 1: 0; 2: 0; 3: 0; 4: 0; 5: 2; 6: 3; 7: 4; 8: 6 };
  road: {
    0: 2500;
    1: 2500;
    2: 2500;
    3: 2500;
    4: 2500;
    5: 2500;
    6: 2500;
    7: 2500;
    8: 2500;
  };
  constructedWall: {
    1: 0;
    2: 2500;
    3: 2500;
    4: 2500;
    5: 2500;
    6: 2500;
    7: 2500;
    8: 2500;
  };
  rampart: {
    1: 0;
    2: 2500;
    3: 2500;
    4: 2500;
    5: 2500;
    6: 2500;
    7: 2500;
    8: 2500;
  };
  storage: { 1: 0; 2: 0; 3: 0; 4: 1; 5: 1; 6: 1; 7: 1; 8: 1 };
  tower: { 1: 0; 2: 0; 3: 1; 4: 1; 5: 2; 6: 2; 7: 3; 8: 6 };
  observer: { 1: 0; 2: 0; 3: 0; 4: 0; 5: 0; 6: 0; 7: 0; 8: 1 };
  powerSpawn: { 1: 0; 2: 0; 3: 0; 4: 0; 5: 0; 6: 0; 7: 0; 8: 1 };
  extractor: { 1: 0; 2: 0; 3: 0; 4: 0; 5: 0; 6: 1; 7: 1; 8: 1 };
  terminal: { 1: 0; 2: 0; 3: 0; 4: 0; 5: 0; 6: 1; 7: 1; 8: 1 };
  lab: { 1: 0; 2: 0; 3: 0; 4: 0; 5: 0; 6: 3; 7: 6; 8: 10 };
  container: { 0: 5; 1: 5; 2: 5; 3: 5; 4: 5; 5: 5; 6: 5; 7: 5; 8: 5 };
  nuker: { 1: 0; 2: 0; 3: 0; 4: 0; 5: 0; 6: 0; 7: 0; 8: 1 };
  factory: { 1: 0; 2: 0; 3: 0; 4: 0; 5: 0; 6: 0; 7: 1; 8: 1 };
};
declare let CONTROLLER_DOWNGRADE: {
  1: 20000;
  2: 10000;
  3: 20000;
  4: 40000;
  5: 80000;
  6: 120000;
  7: 150000;
  8: 200000;
};
declare let CONTROLLER_DOWNGRADE_RESTORE: 100;
declare let CONTROLLER_DOWNGRADE_SAFEMODE_THRESHOLD: 5000;
declare let CONTROLLER_CLAIM_DOWNGRADE: 300;
declare let CONTROLLER_RESERVE: 1;
declare let CONTROLLER_RESERVE_MAX: 5000;
declare let CONTROLLER_MAX_UPGRADE_PER_TICK: 15;
declare let CONTROLLER_ATTACK_BLOCKED_UPGRADE: 1000;
declare let CONTROLLER_NUKE_BLOCKED_UPGRADE: 200;
declare let SAFE_MODE_DURATION: 20000;
declare let SAFE_MODE_COOLDOWN: 50000;
declare let SAFE_MODE_COST: 1000;
declare let TOWER_HITS: 3000;
declare let TOWER_CAPACITY: 1000;
declare let TOWER_ENERGY_COST: 10;
declare let TOWER_POWER_ATTACK: 600;
declare let TOWER_POWER_HEAL: 400;
declare let TOWER_POWER_REPAIR: 800;
declare let TOWER_OPTIMAL_RANGE: 5;
declare let TOWER_FALLOFF_RANGE: 20;
declare let TOWER_FALLOFF: 0.75;
declare let OBSERVER_HITS: 500;
declare let OBSERVER_RANGE: 10;
declare let POWER_BANK_HITS: 2000000;
declare let POWER_BANK_CAPACITY_MAX: 5000;
declare let POWER_BANK_CAPACITY_MIN: 500;
declare let POWER_BANK_CAPACITY_CRIT: 0.3;
declare let POWER_BANK_DECAY: 5000;
declare let POWER_BANK_HIT_BACK: 0.5;
declare let POWER_SPAWN_HITS: 5000;
declare let POWER_SPAWN_ENERGY_CAPACITY: 5000;
declare let POWER_SPAWN_POWER_CAPACITY: 100;
declare let POWER_SPAWN_ENERGY_RATIO: 50;
declare let EXTRACTOR_HITS: 500;
declare let EXTRACTOR_COOLDOWN: 5;
declare let LAB_HITS: 500;
declare let LAB_MINERAL_CAPACITY: 3000;
declare let LAB_ENERGY_CAPACITY: 2000;
declare let LAB_BOOST_ENERGY: 20;
declare let LAB_BOOST_MINERAL: 30;
declare let LAB_COOLDOWN: 10; // not used
declare let LAB_REACTION_AMOUNT: 5;
declare let LAB_UNBOOST_ENERGY: 0;
declare let LAB_UNBOOST_MINERAL: 15;
declare let GCL_POW: 2.4;
declare let GCL_MULTIPLY: 1000000;
declare let GCL_NOVICE: 3;
declare let MODE_SIMULATION: null;
declare let MODE_WORLD: null;
declare let TERRAIN_MASK_WALL: 1;
declare let TERRAIN_MASK_SWAMP: 2;
declare let TERRAIN_MASK_LAVA: 4;
declare let MAX_CONSTRUCTION_SITES: 100;
declare let MAX_CREEP_SIZE: 50;
declare let MINERAL_REGEN_TIME: 50000;
declare let MINERAL_MIN_AMOUNT: {
  H: 35000;
  O: 35000;
  L: 35000;
  K: 35000;
  Z: 35000;
  U: 35000;
  X: 35000;
};
declare let MINERAL_RANDOM_FACTOR: 2;
declare let MINERAL_DENSITY: { 1: 15000; 2: 35000; 3: 70000; 4: 100000 };
declare let MINERAL_DENSITY_PROBABILITY: { 1: 0.1; 2: 0.5; 3: 0.9; 4: 1.0 };
declare let MINERAL_DENSITY_CHANGE: 0.05;
declare let DENSITY_LOW: 1;
declare let DENSITY_MODERATE: 2;
declare let DENSITY_HIGH: 3;
declare let DENSITY_ULTRA: 4;
declare let DEPOSIT_EXHAUST_MULTIPLY: 0.001;
declare let DEPOSIT_EXHAUST_POW: 1.2;
declare let DEPOSIT_DECAY_TIME: 50000;
declare let TERMINAL_CAPACITY: 300000;
declare let TERMINAL_HITS: 3000;
declare let TERMINAL_SEND_COST: 0.1;
declare let TERMINAL_MIN_SEND: 100;
declare let TERMINAL_COOLDOWN: 10;
declare let CONTAINER_HITS: 250000;
declare let CONTAINER_CAPACITY: 2000;
declare let CONTAINER_DECAY: 5000;
declare let CONTAINER_DECAY_TIME: 100;
declare let CONTAINER_DECAY_TIME_OWNED: 500;
declare let NUKER_HITS: 1000;
declare let NUKER_COOLDOWN: 100000;
declare let NUKER_ENERGY_CAPACITY: 300000;
declare let NUKER_GHODIUM_CAPACITY: 5000;
declare let NUKE_LAND_TIME: 50000;
declare let NUKE_RANGE: 10;
declare let NUKE_DAMAGE: { 0: 10000000; 2: 5000000 };
declare let FACTORY_HITS: 1000;
declare let FACTORY_CAPACITY: 50000;
declare let TOMBSTONE_DECAY_PER_PART: 5;
declare let TOMBSTONE_DECAY_POWER_CREEP: 500;
declare let RUIN_DECAY: 500;
declare let RUIN_DECAY_STRUCTURES: { powerBank: 10 };
declare let PORTAL_DECAY: 30000;
declare let ORDER_SELL: "sell";
declare let ORDER_BUY: "buy";
declare let MARKET_FEE: 0.05;
declare let MARKET_MAX_ORDERS: 300;
declare let MARKET_ORDER_LIFE_TIME: 2592000000;
declare let FLAGS_LIMIT: 10000;
declare let SUBSCRIPTION_TOKEN: "token";
declare let CPU_UNLOCK: "cpuUnlock";
declare let PIXEL: "pixel";
declare let ACCESS_KEY: "accessKey";
declare let PIXEL_CPU_COST: 10000;
declare let RESOURCE_ENERGY: "energy";
declare let RESOURCE_POWER: "power";
declare let RESOURCE_HYDROGEN: "H";
declare let RESOURCE_OXYGEN: "O";
declare let RESOURCE_UTRIUM: "U";
declare let RESOURCE_LEMERGIUM: "L";
declare let RESOURCE_KEANIUM: "K";
declare let RESOURCE_ZYNTHIUM: "Z";
declare let RESOURCE_CATALYST: "X";
declare let RESOURCE_GHODIUM: "G";
declare let RESOURCE_SILICON: "silicon";
declare let RESOURCE_METAL: "metal";
declare let RESOURCE_BIOMASS: "biomass";
declare let RESOURCE_MIST: "mist";
declare let RESOURCE_HYDROXIDE: "OH";
declare let RESOURCE_ZYNTHIUM_KEANITE: "ZK";
declare let RESOURCE_UTRIUM_LEMERGITE: "UL";
declare let RESOURCE_UTRIUM_HYDRIDE: "UH";
declare let RESOURCE_UTRIUM_OXIDE: "UO";
declare let RESOURCE_KEANIUM_HYDRIDE: "KH";
declare let RESOURCE_KEANIUM_OXIDE: "KO";
declare let RESOURCE_LEMERGIUM_HYDRIDE: "LH";
declare let RESOURCE_LEMERGIUM_OXIDE: "LO";
declare let RESOURCE_ZYNTHIUM_HYDRIDE: "ZH";
declare let RESOURCE_ZYNTHIUM_OXIDE: "ZO";
declare let RESOURCE_GHODIUM_HYDRIDE: "GH";
declare let RESOURCE_GHODIUM_OXIDE: "GO";
declare let RESOURCE_UTRIUM_ACID: "UH2O";
declare let RESOURCE_UTRIUM_ALKALIDE: "UHO2";
declare let RESOURCE_KEANIUM_ACID: "KH2O";
declare let RESOURCE_KEANIUM_ALKALIDE: "KHO2";
declare let RESOURCE_LEMERGIUM_ACID: "LH2O";
declare let RESOURCE_LEMERGIUM_ALKALIDE: "LHO2";
declare let RESOURCE_ZYNTHIUM_ACID: "ZH2O";
declare let RESOURCE_ZYNTHIUM_ALKALIDE: "ZHO2";
declare let RESOURCE_GHODIUM_ACID: "GH2O";
declare let RESOURCE_GHODIUM_ALKALIDE: "GHO2";
declare let RESOURCE_CATALYZED_UTRIUM_ACID: "XUH2O";
declare let RESOURCE_CATALYZED_UTRIUM_ALKALIDE: "XUHO2";
declare let RESOURCE_CATALYZED_KEANIUM_ACID: "XKH2O";
declare let RESOURCE_CATALYZED_KEANIUM_ALKALIDE: "XKHO2";
declare let RESOURCE_CATALYZED_LEMERGIUM_ACID: "XLH2O";
declare let RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE: "XLHO2";
declare let RESOURCE_CATALYZED_ZYNTHIUM_ACID: "XZH2O";
declare let RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE: "XZHO2";
declare let RESOURCE_CATALYZED_GHODIUM_ACID: "XGH2O";
declare let RESOURCE_CATALYZED_GHODIUM_ALKALIDE: "XGHO2";
declare let RESOURCE_OPS: "ops";
declare let RESOURCE_UTRIUM_BAR: "utrium_bar";
declare let RESOURCE_LEMERGIUM_BAR: "lemergium_bar";
declare let RESOURCE_ZYNTHIUM_BAR: "zynthium_bar";
declare let RESOURCE_KEANIUM_BAR: "keanium_bar";
declare let RESOURCE_GHODIUM_MELT: "ghodium_melt";
declare let RESOURCE_OXIDANT: "oxidant";
declare let RESOURCE_REDUCTANT: "reductant";
declare let RESOURCE_PURIFIER: "purifier";
declare let RESOURCE_BATTERY: "battery";
declare let RESOURCE_COMPOSITE: "composite";
declare let RESOURCE_CRYSTAL: "crystal";
declare let RESOURCE_LIQUID: "liquid";
declare let RESOURCE_WIRE: "wire";
declare let RESOURCE_SWITCH: "switch";
declare let RESOURCE_TRANSISTOR: "transistor";
declare let RESOURCE_MICROCHIP: "microchip";
declare let RESOURCE_CIRCUIT: "circuit";
declare let RESOURCE_DEVICE: "device";
declare let RESOURCE_CELL: "cell";
declare let RESOURCE_PHLEGM: "phlegm";
declare let RESOURCE_TISSUE: "tissue";
declare let RESOURCE_MUSCLE: "muscle";
declare let RESOURCE_ORGANOID: "organoid";
declare let RESOURCE_ORGANISM: "organism";
declare let RESOURCE_ALLOY: "alloy";
declare let RESOURCE_TUBE: "tube";
declare let RESOURCE_FIXTURES: "fixtures";
declare let RESOURCE_FRAME: "frame";
declare let RESOURCE_HYDRAULICS: "hydraulics";
declare let RESOURCE_MACHINE: "machine";
declare let RESOURCE_CONDENSATE: "condensate";
declare let RESOURCE_CONCENTRATE: "concentrate";
declare let RESOURCE_EXTRACT: "extract";
declare let RESOURCE_SPIRIT: "spirit";
declare let RESOURCE_EMANATION: "emanation";
declare let RESOURCE_ESSENCE: "essence";
declare let REACTIONS: {
  H: { O: "OH"; L: "LH"; K: "KH"; U: "UH"; Z: "ZH"; G: "GH" };
  O: { H: "OH"; L: "LO"; K: "KO"; U: "UO"; Z: "ZO"; G: "GO" };
  Z: { K: "ZK"; H: "ZH"; O: "ZO" };
  L: { U: "UL"; H: "LH"; O: "LO" };
  K: { Z: "ZK"; H: "KH"; O: "KO" };
  G: { H: "GH"; O: "GO" };
  U: { L: "UL"; H: "UH"; O: "UO" };
  OH: {
    UH: "UH2O";
    UO: "UHO2";
    ZH: "ZH2O";
    ZO: "ZHO2";
    KH: "KH2O";
    KO: "KHO2";
    LH: "LH2O";
    LO: "LHO2";
    GH: "GH2O";
    GO: "GHO2";
  };
  X: {
    UH2O: "XUH2O";
    UHO2: "XUHO2";
    LH2O: "XLH2O";
    LHO2: "XLHO2";
    KH2O: "XKH2O";
    KHO2: "XKHO2";
    ZH2O: "XZH2O";
    ZHO2: "XZHO2";
    GH2O: "XGH2O";
    GHO2: "XGHO2";
  };
  ZK: { UL: "G" };
  UL: { ZK: "G" };
  LH: { OH: "LH2O" };
  ZH: { OH: "ZH2O" };
  GH: { OH: "GH2O" };
  KH: { OH: "KH2O" };
  UH: { OH: "UH2O" };
  LO: { OH: "LHO2" };
  ZO: { OH: "ZHO2" };
  KO: { OH: "KHO2" };
  UO: { OH: "UHO2" };
  GO: { OH: "GHO2" };
  LH2O: { X: "XLH2O" };
  KH2O: { X: "XKH2O" };
  ZH2O: { X: "XZH2O" };
  UH2O: { X: "XUH2O" };
  GH2O: { X: "XGH2O" };
  LHO2: { X: "XLHO2" };
  UHO2: { X: "XUHO2" };
  KHO2: { X: "XKHO2" };
  ZHO2: { X: "XZHO2" };
  GHO2: { X: "XGHO2" };
};
declare let BOOSTS: {
  work: {
    UO: { harvest: 3 };
    UHO2: { harvest: 5 };
    XUHO2: { harvest: 7 };
    LH: { build: 1.5; repair: 1.5 };
    LH2O: { build: 1.8; repair: 1.8 };
    XLH2O: { build: 2; repair: 2 };
    ZH: { dismantle: 2 };
    ZH2O: { dismantle: 3 };
    XZH2O: { dismantle: 4 };
    GH: { upgradeController: 1.5 };
    GH2O: { upgradeController: 1.8 };
    XGH2O: { upgradeController: 2 };
  };
  attack: { UH: { attack: 2 }; UH2O: { attack: 3 }; XUH2O: { attack: 4 } };
  ranged_attack: {
    KO: { rangedAttack: 2; rangedMassAttack: 2 };
    KHO2: { rangedAttack: 3; rangedMassAttack: 3 };
    XKHO2: { rangedAttack: 4; rangedMassAttack: 4 };
  };
  heal: {
    LO: { heal: 2; rangedHeal: 2 };
    LHO2: { heal: 3; rangedHeal: 3 };
    XLHO2: { heal: 4; rangedHeal: 4 };
  };
  carry: { KH: { capacity: 2 }; KH2O: { capacity: 3 }; XKH2O: { capacity: 4 } };
  move: { ZO: { fatigue: 2 }; ZHO2: { fatigue: 3 }; XZHO2: { fatigue: 4 } };
  tough: { GO: { damage: 0.7 }; GHO2: { damage: 0.5 }; XGHO2: { damage: 0.3 } };
};
declare let REACTION_TIME: {
  OH: 20;
  ZK: 5;
  UL: 5;
  G: 5;
  UH: 10;
  UH2O: 5;
  XUH2O: 60;
  UO: 10;
  UHO2: 5;
  XUHO2: 60;
  KH: 10;
  KH2O: 5;
  XKH2O: 60;
  KO: 10;
  KHO2: 5;
  XKHO2: 60;
  LH: 15;
  LH2O: 10;
  XLH2O: 65;
  LO: 10;
  LHO2: 5;
  XLHO2: 60;
  ZH: 20;
  ZH2O: 40;
  XZH2O: 160;
  ZO: 10;
  ZHO2: 5;
  XZHO2: 60;
  GH: 10;
  GH2O: 15;
  XGH2O: 80;
  GO: 10;
  GHO2: 30;
  XGHO2: 150;
};
declare let PORTAL_UNSTABLE: 864000000;
declare let PORTAL_MIN_TIMEOUT: 1036800000;
declare let PORTAL_MAX_TIMEOUT: 1900800000;
declare let POWER_BANK_RESPAWN_TIME: 50000;
declare let INVADERS_ENERGY_GOAL: 100000;
declare let SYSTEM_USERNAME: "Screeps";
declare let SIGN_NOVICE_AREA: "A new Novice or Respawn Area is being planned somewhere in this sector. Please make sure all important rooms are reserved.";
declare let SIGN_RESPAWN_AREA: "A new Novice or Respawn Area is being planned somewhere in this sector. Please make sure all important rooms are reserved.";
declare let SIGN_PLANNED_AREA: "A new Novice or Respawn Area is being planned somewhere in this sector. Please make sure all important rooms are reserved.";
declare let EVENT_ATTACK: 1;
declare let EVENT_OBJECT_DESTROYED: 2;
declare let EVENT_ATTACK_CONTROLLER: 3;
declare let EVENT_BUILD: 4;
declare let EVENT_HARVEST: 5;
declare let EVENT_HEAL: 6;
declare let EVENT_REPAIR: 7;
declare let EVENT_RESERVE_CONTROLLER: 8;
declare let EVENT_UPGRADE_CONTROLLER: 9;
declare let EVENT_EXIT: 10;
declare let EVENT_POWER: 11;
declare let EVENT_TRANSFER: 12;
declare let EVENT_ATTACK_TYPE_MELEE: 1;
declare let EVENT_ATTACK_TYPE_RANGED: 2;
declare let EVENT_ATTACK_TYPE_RANGED_MASS: 3;
declare let EVENT_ATTACK_TYPE_DISMANTLE: 4;
declare let EVENT_ATTACK_TYPE_HIT_BACK: 5;
declare let EVENT_ATTACK_TYPE_NUKE: 6;
declare let EVENT_HEAL_TYPE_MELEE: 1;
declare let EVENT_HEAL_TYPE_RANGED: 2;
declare let POWER_LEVEL_MULTIPLY: 1000;
declare let POWER_LEVEL_POW: 2;
declare let POWER_CREEP_SPAWN_COOLDOWN: 28800000;
declare let POWER_CREEP_DELETE_COOLDOWN: 86400000;
declare let POWER_CREEP_MAX_LEVEL: 25;
declare let POWER_CREEP_LIFE_TIME: 5000;
declare let POWER_CLASS: { OPERATOR: "operator" };
declare let PWR_GENERATE_OPS: 1;
declare let PWR_OPERATE_SPAWN: 2;
declare let PWR_OPERATE_TOWER: 3;
declare let PWR_OPERATE_STORAGE: 4;
declare let PWR_OPERATE_LAB: 5;
declare let PWR_OPERATE_EXTENSION: 6;
declare let PWR_OPERATE_OBSERVER: 7;
declare let PWR_OPERATE_TERMINAL: 8;
declare let PWR_DISRUPT_SPAWN: 9;
declare let PWR_DISRUPT_TOWER: 10;
declare let PWR_DISRUPT_SOURCE: 11;
declare let PWR_SHIELD: 12;
declare let PWR_REGEN_SOURCE: 13;
declare let PWR_REGEN_MINERAL: 14;
declare let PWR_DISRUPT_TERMINAL: 15;
declare let PWR_OPERATE_POWER: 16;
declare let PWR_FORTIFY: 17;
declare let PWR_OPERATE_CONTROLLER: 18;
declare let PWR_OPERATE_FACTORY: 19;
declare let EFFECT_INVULNERABILITY: 1001;
declare let EFFECT_COLLAPSE_TIMER: 1002;
declare let INVADER_CORE_HITS: 100000;
declare let INVADER_CORE_CREEP_SPAWN_TIME: {
  0: 0;
  1: 0;
  2: 6;
  3: 3;
  4: 2;
  5: 1;
};
declare let INVADER_CORE_EXPAND_TIME: {
  1: 4000;
  2: 3500;
  3: 3000;
  4: 2500;
  5: 2000;
};
declare let INVADER_CORE_CONTROLLER_POWER: 2;
declare let INVADER_CORE_CONTROLLER_DOWNGRADE: 5000;
declare let STRONGHOLD_RAMPART_HITS: {
  0: 0;
  1: 100000;
  2: 200000;
  3: 500000;
  4: 1000000;
  5: 2000000;
};
declare let STRONGHOLD_DECAY_TICKS: 75000;
declare let POWER_INFO: {
  [PWR_GENERATE_OPS]: {
    className: typeof POWER_CLASS.OPERATOR;
    level: [0, 2, 7, 14, 22];
    cooldown: 50;
    effect: [1, 2, 4, 6, 8];
  };
  [PWR_OPERATE_SPAWN]: {
    className: typeof POWER_CLASS.OPERATOR;
    level: [0, 2, 7, 14, 22];
    cooldown: 300;
    duration: 1000;
    range: 3;
    ops: 100;
    effect: [0.9, 0.7, 0.5, 0.35, 0.2];
  };
  [PWR_OPERATE_TOWER]: {
    className: typeof POWER_CLASS.OPERATOR;
    level: [0, 2, 7, 14, 22];
    cooldown: 10;
    duration: 100;
    range: 3;
    ops: 10;
    effect: [1.1, 1.2, 1.3, 1.4, 1.5];
  };
  [PWR_OPERATE_STORAGE]: {
    className: typeof POWER_CLASS.OPERATOR;
    level: [0, 2, 7, 14, 22];
    cooldown: 800;
    duration: 1000;
    range: 3;
    ops: 100;
    effect: [500000, 1000000, 2000000, 4000000, 7000000];
  };
  [PWR_OPERATE_LAB]: {
    className: typeof POWER_CLASS.OPERATOR;
    level: [0, 2, 7, 14, 22];
    cooldown: 50;
    duration: 1000;
    range: 3;
    ops: 10;
    effect: [2, 4, 6, 8, 10];
  };
  [PWR_OPERATE_EXTENSION]: {
    className: typeof POWER_CLASS.OPERATOR;
    level: [0, 2, 7, 14, 22];
    cooldown: 50;
    range: 3;
    ops: 2;
    effect: [0.2, 0.4, 0.6, 0.8, 1.0];
  };
  [PWR_OPERATE_OBSERVER]: {
    className: typeof POWER_CLASS.OPERATOR;
    level: [0, 2, 7, 14, 22];
    cooldown: 400;
    duration: [200, 400, 600, 800, 1000];
    range: 3;
    ops: 10;
  };
  [PWR_OPERATE_TERMINAL]: {
    className: typeof POWER_CLASS.OPERATOR;
    level: [0, 2, 7, 14, 22];
    cooldown: 500;
    duration: 1000;
    range: 3;
    ops: 100;
    effect: [0.9, 0.8, 0.7, 0.6, 0.5];
  };
  [PWR_DISRUPT_SPAWN]: {
    className: typeof POWER_CLASS.OPERATOR;
    level: [0, 2, 7, 14, 22];
    cooldown: 5;
    range: 20;
    ops: 10;
    duration: [1, 2, 3, 4, 5];
  };
  [PWR_DISRUPT_TOWER]: {
    className: typeof POWER_CLASS.OPERATOR;
    level: [0, 2, 7, 14, 22];
    cooldown: 0;
    duration: 5;
    range: 50;
    ops: 10;
    effect: [0.9, 0.8, 0.7, 0.6, 0.5];
  };
  [PWR_DISRUPT_SOURCE]: {
    className: typeof POWER_CLASS.OPERATOR;
    level: [0, 2, 7, 14, 22];
    cooldown: 100;
    range: 3;
    ops: 100;
    duration: [100, 200, 300, 400, 500];
  };
  [PWR_SHIELD]: {
    className: typeof POWER_CLASS.OPERATOR;
    level: [0, 2, 7, 14, 22];
    effect: [5000, 10000, 15000, 20000, 25000];
    duration: 50;
    cooldown: 20;
    energy: 100;
  };
  [PWR_REGEN_SOURCE]: {
    className: typeof POWER_CLASS.OPERATOR;
    level: [10, 11, 12, 14, 22];
    cooldown: 100;
    duration: 300;
    range: 3;
    effect: [50, 100, 150, 200, 250];
    period: 15;
  };
  [PWR_REGEN_MINERAL]: {
    className: typeof POWER_CLASS.OPERATOR;
    level: [10, 11, 12, 14, 22];
    cooldown: 100;
    duration: 100;
    range: 3;
    effect: [2, 4, 6, 8, 10];
    period: 10;
  };
  [PWR_DISRUPT_TERMINAL]: {
    className: typeof POWER_CLASS.OPERATOR;
    level: [20, 21, 22, 23, 24];
    cooldown: 8;
    duration: 10;
    range: 50;
    ops: [50, 40, 30, 20, 10];
  };
  [PWR_FORTIFY]: {
    className: typeof POWER_CLASS.OPERATOR;
    level: [0, 2, 7, 14, 22];
    cooldown: 5;
    range: 3;
    ops: 5;
    duration: [1, 2, 3, 4, 5];
  };
  [PWR_OPERATE_POWER]: {
    className: typeof POWER_CLASS.OPERATOR;
    level: [10, 11, 12, 14, 22];
    cooldown: 800;
    range: 3;
    duration: 1000;
    ops: 200;
    effect: [1, 2, 3, 4, 5];
  };
  [PWR_OPERATE_CONTROLLER]: {
    className: typeof POWER_CLASS.OPERATOR;
    level: [20, 21, 22, 23, 24];
    cooldown: 800;
    range: 3;
    duration: 1000;
    ops: 200;
    effect: [10, 20, 30, 40, 50];
  };
  [PWR_OPERATE_FACTORY]: {
    className: typeof POWER_CLASS.OPERATOR;
    level: [0, 2, 7, 14, 22];
    cooldown: 800;
    range: 3;
    duration: 1000;
    ops: 100;
  };
};
declare let BODYPARTS_ALL: [
  typeof MOVE,
  typeof WORK,
  typeof CARRY,
  typeof ATTACK,
  typeof RANGED_ATTACK,
  typeof TOUGH,
  typeof HEAL,
  typeof CLAIM,
];
declare let RESOURCES_ALL: [
  typeof RESOURCE_ENERGY,
  typeof RESOURCE_POWER,
  typeof RESOURCE_HYDROGEN,
  typeof RESOURCE_OXYGEN,
  typeof RESOURCE_UTRIUM,
  typeof RESOURCE_KEANIUM,
  typeof RESOURCE_LEMERGIUM,
  typeof RESOURCE_ZYNTHIUM,
  typeof RESOURCE_CATALYST,
  typeof RESOURCE_GHODIUM,
  typeof RESOURCE_HYDROXIDE,
  typeof RESOURCE_ZYNTHIUM_KEANITE,
  typeof RESOURCE_UTRIUM_LEMERGITE,
  typeof RESOURCE_UTRIUM_HYDRIDE,
  typeof RESOURCE_UTRIUM_OXIDE,
  typeof RESOURCE_KEANIUM_HYDRIDE,
  typeof RESOURCE_KEANIUM_OXIDE,
  typeof RESOURCE_LEMERGIUM_HYDRIDE,
  typeof RESOURCE_LEMERGIUM_OXIDE,
  typeof RESOURCE_ZYNTHIUM_HYDRIDE,
  typeof RESOURCE_ZYNTHIUM_OXIDE,
  typeof RESOURCE_GHODIUM_HYDRIDE,
  typeof RESOURCE_GHODIUM_OXIDE,
  typeof RESOURCE_UTRIUM_ACID,
  typeof RESOURCE_UTRIUM_ALKALIDE,
  typeof RESOURCE_KEANIUM_ACID,
  typeof RESOURCE_KEANIUM_ALKALIDE,
  typeof RESOURCE_LEMERGIUM_ACID,
  typeof RESOURCE_LEMERGIUM_ALKALIDE,
  typeof RESOURCE_ZYNTHIUM_ACID,
  typeof RESOURCE_ZYNTHIUM_ALKALIDE,
  typeof RESOURCE_GHODIUM_ACID,
  typeof RESOURCE_GHODIUM_ALKALIDE,
  typeof RESOURCE_CATALYZED_UTRIUM_ACID,
  typeof RESOURCE_CATALYZED_UTRIUM_ALKALIDE,
  typeof RESOURCE_CATALYZED_KEANIUM_ACID,
  typeof RESOURCE_CATALYZED_KEANIUM_ALKALIDE,
  typeof RESOURCE_CATALYZED_LEMERGIUM_ACID,
  typeof RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE,
  typeof RESOURCE_CATALYZED_ZYNTHIUM_ACID,
  typeof RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE,
  typeof RESOURCE_CATALYZED_GHODIUM_ACID,
  typeof RESOURCE_CATALYZED_GHODIUM_ALKALIDE,
  typeof RESOURCE_OPS,
  typeof RESOURCE_SILICON,
  typeof RESOURCE_METAL,
  typeof RESOURCE_BIOMASS,
  typeof RESOURCE_MIST,
  typeof RESOURCE_UTRIUM_BAR,
  typeof RESOURCE_LEMERGIUM_BAR,
  typeof RESOURCE_ZYNTHIUM_BAR,
  typeof RESOURCE_KEANIUM_BAR,
  typeof RESOURCE_GHODIUM_MELT,
  typeof RESOURCE_OXIDANT,
  typeof RESOURCE_REDUCTANT,
  typeof RESOURCE_PURIFIER,
  typeof RESOURCE_BATTERY,
  typeof RESOURCE_COMPOSITE,
  typeof RESOURCE_CRYSTAL,
  typeof RESOURCE_LIQUID,
  typeof RESOURCE_WIRE,
  typeof RESOURCE_SWITCH,
  typeof RESOURCE_TRANSISTOR,
  typeof RESOURCE_MICROCHIP,
  typeof RESOURCE_CIRCUIT,
  typeof RESOURCE_DEVICE,
  typeof RESOURCE_CELL,
  typeof RESOURCE_PHLEGM,
  typeof RESOURCE_TISSUE,
  typeof RESOURCE_MUSCLE,
  typeof RESOURCE_ORGANOID,
  typeof RESOURCE_ORGANISM,
  typeof RESOURCE_ALLOY,
  typeof RESOURCE_TUBE,
  typeof RESOURCE_FIXTURES,
  typeof RESOURCE_FRAME,
  typeof RESOURCE_HYDRAULICS,
  typeof RESOURCE_MACHINE,
  typeof RESOURCE_CONDENSATE,
  typeof RESOURCE_CONCENTRATE,
  typeof RESOURCE_EXTRACT,
  typeof RESOURCE_SPIRIT,
  typeof RESOURCE_EMANATION,
  typeof RESOURCE_ESSENCE,
];
declare let COLORS_ALL: [
  typeof COLOR_RED,
  typeof COLOR_PURPLE,
  typeof COLOR_BLUE,
  typeof COLOR_CYAN,
  typeof COLOR_GREEN,
  typeof COLOR_YELLOW,
  typeof COLOR_ORANGE,
  typeof COLOR_BROWN,
  typeof COLOR_GREY,
  typeof COLOR_WHITE,
];
declare let INTERSHARD_RESOURCES: [
  typeof SUBSCRIPTION_TOKEN,
  typeof CPU_UNLOCK,
  typeof PIXEL,
  typeof ACCESS_KEY,
];
declare let COMMODITIES: {
  [RESOURCE_UTRIUM_BAR]: {
    amount: 100;
    cooldown: 20;
    components: { [RESOURCE_UTRIUM]: 500; [RESOURCE_ENERGY]: 200 };
  };
  [RESOURCE_UTRIUM]: {
    amount: 500;
    cooldown: 20;
    components: { [RESOURCE_UTRIUM_BAR]: 100; [RESOURCE_ENERGY]: 200 };
  };
  [RESOURCE_LEMERGIUM_BAR]: {
    amount: 100;
    cooldown: 20;
    components: { [RESOURCE_LEMERGIUM]: 500; [RESOURCE_ENERGY]: 200 };
  };
  [RESOURCE_LEMERGIUM]: {
    amount: 500;
    cooldown: 20;
    components: { [RESOURCE_LEMERGIUM_BAR]: 100; [RESOURCE_ENERGY]: 200 };
  };
  [RESOURCE_ZYNTHIUM_BAR]: {
    amount: 100;
    cooldown: 20;
    components: { [RESOURCE_ZYNTHIUM]: 500; [RESOURCE_ENERGY]: 200 };
  };
  [RESOURCE_ZYNTHIUM]: {
    amount: 500;
    cooldown: 20;
    components: { [RESOURCE_ZYNTHIUM_BAR]: 100; [RESOURCE_ENERGY]: 200 };
  };
  [RESOURCE_KEANIUM_BAR]: {
    amount: 100;
    cooldown: 20;
    components: { [RESOURCE_KEANIUM]: 500; [RESOURCE_ENERGY]: 200 };
  };
  [RESOURCE_KEANIUM]: {
    amount: 500;
    cooldown: 20;
    components: { [RESOURCE_KEANIUM_BAR]: 100; [RESOURCE_ENERGY]: 200 };
  };
  [RESOURCE_GHODIUM_MELT]: {
    amount: 100;
    cooldown: 20;
    components: { [RESOURCE_GHODIUM]: 500; [RESOURCE_ENERGY]: 200 };
  };
  [RESOURCE_GHODIUM]: {
    amount: 500;
    cooldown: 20;
    components: { [RESOURCE_GHODIUM_MELT]: 100; [RESOURCE_ENERGY]: 200 };
  };
  [RESOURCE_OXIDANT]: {
    amount: 100;
    cooldown: 20;
    components: { [RESOURCE_OXYGEN]: 500; [RESOURCE_ENERGY]: 200 };
  };
  [RESOURCE_OXYGEN]: {
    amount: 500;
    cooldown: 20;
    components: { [RESOURCE_OXIDANT]: 100; [RESOURCE_ENERGY]: 200 };
  };
  [RESOURCE_REDUCTANT]: {
    amount: 100;
    cooldown: 20;
    components: { [RESOURCE_HYDROGEN]: 500; [RESOURCE_ENERGY]: 200 };
  };
  [RESOURCE_HYDROGEN]: {
    amount: 500;
    cooldown: 20;
    components: { [RESOURCE_REDUCTANT]: 100; [RESOURCE_ENERGY]: 200 };
  };
  [RESOURCE_PURIFIER]: {
    amount: 100;
    cooldown: 20;
    components: { [RESOURCE_CATALYST]: 500; [RESOURCE_ENERGY]: 200 };
  };
  [RESOURCE_CATALYST]: {
    amount: 500;
    cooldown: 20;
    components: { [RESOURCE_PURIFIER]: 100; [RESOURCE_ENERGY]: 200 };
  };
  [RESOURCE_BATTERY]: {
    amount: 50;
    cooldown: 10;
    components: { [RESOURCE_ENERGY]: 600 };
  };
  [RESOURCE_ENERGY]: {
    amount: 500;
    cooldown: 10;
    components: { [RESOURCE_BATTERY]: 50 };
  };
  [RESOURCE_COMPOSITE]: {
    level: 1;
    amount: 20;
    cooldown: 50;
    components: {
      [RESOURCE_UTRIUM_BAR]: 20;
      [RESOURCE_ZYNTHIUM_BAR]: 20;
      [RESOURCE_ENERGY]: 20;
    };
  };
  [RESOURCE_CRYSTAL]: {
    level: 2;
    amount: 6;
    cooldown: 21;
    components: {
      [RESOURCE_LEMERGIUM_BAR]: 6;
      [RESOURCE_KEANIUM_BAR]: 6;
      [RESOURCE_PURIFIER]: 6;
      [RESOURCE_ENERGY]: 45;
    };
  };
  [RESOURCE_LIQUID]: {
    level: 3;
    amount: 12;
    cooldown: 60;
    components: {
      [RESOURCE_OXIDANT]: 12;
      [RESOURCE_REDUCTANT]: 12;
      [RESOURCE_GHODIUM_MELT]: 12;
      [RESOURCE_ENERGY]: 90;
    };
  };
  [RESOURCE_WIRE]: {
    amount: 20;
    cooldown: 8;
    components: {
      [RESOURCE_UTRIUM_BAR]: 20;
      [RESOURCE_SILICON]: 100;
      [RESOURCE_ENERGY]: 40;
    };
  };
  [RESOURCE_SWITCH]: {
    level: 1;
    amount: 5;
    cooldown: 70;
    components: {
      [RESOURCE_WIRE]: 40;
      [RESOURCE_OXIDANT]: 95;
      [RESOURCE_UTRIUM_BAR]: 35;
      [RESOURCE_ENERGY]: 20;
    };
  };
  [RESOURCE_TRANSISTOR]: {
    level: 2;
    amount: 1;
    cooldown: 59;
    components: {
      [RESOURCE_SWITCH]: 4;
      [RESOURCE_WIRE]: 15;
      [RESOURCE_REDUCTANT]: 85;
      [RESOURCE_ENERGY]: 8;
    };
  };
  [RESOURCE_MICROCHIP]: {
    level: 3;
    amount: 1;
    cooldown: 250;
    components: {
      [RESOURCE_TRANSISTOR]: 2;
      [RESOURCE_COMPOSITE]: 50;
      [RESOURCE_WIRE]: 117;
      [RESOURCE_PURIFIER]: 25;
      [RESOURCE_ENERGY]: 16;
    };
  };
  [RESOURCE_CIRCUIT]: {
    level: 4;
    amount: 1;
    cooldown: 800;
    components: {
      [RESOURCE_MICROCHIP]: 1;
      [RESOURCE_TRANSISTOR]: 5;
      [RESOURCE_SWITCH]: 4;
      [RESOURCE_OXIDANT]: 115;
      [RESOURCE_ENERGY]: 32;
    };
  };
  [RESOURCE_DEVICE]: {
    level: 5;
    amount: 1;
    cooldown: 600;
    components: {
      [RESOURCE_CIRCUIT]: 1;
      [RESOURCE_MICROCHIP]: 3;
      [RESOURCE_CRYSTAL]: 110;
      [RESOURCE_GHODIUM_MELT]: 150;
      [RESOURCE_ENERGY]: 64;
    };
  };
  [RESOURCE_CELL]: {
    amount: 20;
    cooldown: 8;
    components: {
      [RESOURCE_LEMERGIUM_BAR]: 20;
      [RESOURCE_BIOMASS]: 100;
      [RESOURCE_ENERGY]: 40;
    };
  };
  [RESOURCE_PHLEGM]: {
    level: 1;
    amount: 2;
    cooldown: 35;
    components: {
      [RESOURCE_CELL]: 20;
      [RESOURCE_OXIDANT]: 36;
      [RESOURCE_LEMERGIUM_BAR]: 16;
      [RESOURCE_ENERGY]: 8;
    };
  };
  [RESOURCE_TISSUE]: {
    level: 2;
    amount: 2;
    cooldown: 164;
    components: {
      [RESOURCE_PHLEGM]: 10;
      [RESOURCE_CELL]: 10;
      [RESOURCE_REDUCTANT]: 110;
      [RESOURCE_ENERGY]: 16;
    };
  };
  [RESOURCE_MUSCLE]: {
    level: 3;
    amount: 1;
    cooldown: 250;
    components: {
      [RESOURCE_TISSUE]: 3;
      [RESOURCE_PHLEGM]: 3;
      [RESOURCE_ZYNTHIUM_BAR]: 50;
      [RESOURCE_REDUCTANT]: 50;
      [RESOURCE_ENERGY]: 16;
    };
  };
  [RESOURCE_ORGANOID]: {
    level: 4;
    amount: 1;
    cooldown: 800;
    components: {
      [RESOURCE_MUSCLE]: 1;
      [RESOURCE_TISSUE]: 5;
      [RESOURCE_PURIFIER]: 208;
      [RESOURCE_OXIDANT]: 256;
      [RESOURCE_ENERGY]: 32;
    };
  };
  [RESOURCE_ORGANISM]: {
    level: 5;
    amount: 1;
    cooldown: 600;
    components: {
      [RESOURCE_ORGANOID]: 1;
      [RESOURCE_LIQUID]: 150;
      [RESOURCE_TISSUE]: 6;
      [RESOURCE_CELL]: 310;
      [RESOURCE_ENERGY]: 64;
    };
  };
  [RESOURCE_ALLOY]: {
    amount: 20;
    cooldown: 8;
    components: {
      [RESOURCE_ZYNTHIUM_BAR]: 20;
      [RESOURCE_METAL]: 100;
      [RESOURCE_ENERGY]: 40;
    };
  };
  [RESOURCE_TUBE]: {
    level: 1;
    amount: 2;
    cooldown: 45;
    components: {
      [RESOURCE_ALLOY]: 40;
      [RESOURCE_ZYNTHIUM_BAR]: 16;
      [RESOURCE_ENERGY]: 8;
    };
  };
  [RESOURCE_FIXTURES]: {
    level: 2;
    amount: 1;
    cooldown: 115;
    components: {
      [RESOURCE_COMPOSITE]: 20;
      [RESOURCE_ALLOY]: 41;
      [RESOURCE_OXIDANT]: 161;
      [RESOURCE_ENERGY]: 8;
    };
  };
  [RESOURCE_FRAME]: {
    level: 3;
    amount: 1;
    cooldown: 125;
    components: {
      [RESOURCE_FIXTURES]: 2;
      [RESOURCE_TUBE]: 4;
      [RESOURCE_REDUCTANT]: 330;
      [RESOURCE_ZYNTHIUM_BAR]: 31;
      [RESOURCE_ENERGY]: 16;
    };
  };
  [RESOURCE_HYDRAULICS]: {
    level: 4;
    amount: 1;
    cooldown: 800;
    components: {
      [RESOURCE_LIQUID]: 150;
      [RESOURCE_FIXTURES]: 3;
      [RESOURCE_TUBE]: 15;
      [RESOURCE_PURIFIER]: 208;
      [RESOURCE_ENERGY]: 32;
    };
  };
  [RESOURCE_MACHINE]: {
    level: 5;
    amount: 1;
    cooldown: 600;
    components: {
      [RESOURCE_HYDRAULICS]: 1;
      [RESOURCE_FRAME]: 2;
      [RESOURCE_FIXTURES]: 3;
      [RESOURCE_TUBE]: 12;
      [RESOURCE_ENERGY]: 64;
    };
  };
  [RESOURCE_CONDENSATE]: {
    amount: 20;
    cooldown: 8;
    components: {
      [RESOURCE_KEANIUM_BAR]: 20;
      [RESOURCE_MIST]: 100;
      [RESOURCE_ENERGY]: 40;
    };
  };
  [RESOURCE_CONCENTRATE]: {
    level: 1;
    amount: 3;
    cooldown: 41;
    components: {
      [RESOURCE_CONDENSATE]: 30;
      [RESOURCE_KEANIUM_BAR]: 15;
      [RESOURCE_REDUCTANT]: 54;
      [RESOURCE_ENERGY]: 12;
    };
  };
  [RESOURCE_EXTRACT]: {
    level: 2;
    amount: 2;
    cooldown: 128;
    components: {
      [RESOURCE_CONCENTRATE]: 10;
      [RESOURCE_CONDENSATE]: 30;
      [RESOURCE_OXIDANT]: 60;
      [RESOURCE_ENERGY]: 16;
    };
  };
  [RESOURCE_SPIRIT]: {
    level: 3;
    amount: 1;
    cooldown: 200;
    components: {
      [RESOURCE_EXTRACT]: 2;
      [RESOURCE_CONCENTRATE]: 6;
      [RESOURCE_REDUCTANT]: 90;
      [RESOURCE_PURIFIER]: 20;
      [RESOURCE_ENERGY]: 16;
    };
  };
  [RESOURCE_EMANATION]: {
    level: 4;
    amount: 1;
    cooldown: 800;
    components: {
      [RESOURCE_SPIRIT]: 2;
      [RESOURCE_EXTRACT]: 2;
      [RESOURCE_CONCENTRATE]: 3;
      [RESOURCE_KEANIUM_BAR]: 112;
      [RESOURCE_ENERGY]: 32;
    };
  };
  [RESOURCE_ESSENCE]: {
    level: 5;
    amount: 1;
    cooldown: 600;
    components: {
      [RESOURCE_EMANATION]: 1;
      [RESOURCE_SPIRIT]: 3;
      [RESOURCE_CRYSTAL]: 110;
      [RESOURCE_GHODIUM_MELT]: 150;
      [RESOURCE_ENERGY]: 64;
    };
  };
};
