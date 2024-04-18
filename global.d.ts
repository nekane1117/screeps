import _ from "lodash";
import { DIRECTION, FIND, LOOK } from "./consts";
import { Values } from "./types/utils";
/** ゲームオブジェクト */
declare interface Game {
  creeps: Record<string, Creep>;
}

/** クリープ */
declare interface Creep {}

declare interface RoomObject {
  effects: Effect[];
  pos: RoomPosition;
  room: Room;
}

declare interface Room {
  controller: any;
  energyAvailable: number;
  energyCapacityAvailable: number;
  memory: any;
  name: string;
  storage: any;
  terminal: any;
  visual: boolean;
  serializePath: Function;
  deserializePath: Function;
  createConstructionSite: Function;
  createFlag: Function;
  find: Function;
  findExitTo: Function;
  findPath: Function;
  getEventLog: Function;
  getPositionAt: Function;
  getTerrain: Function;
  lookAt: Function;
  lookAtArea: Function;
  lookForAt: Function;
  lookForAtArea: Function;
}

declare class RoomPosition {
  constructor(x: number, y: number, roomName: string);
  public x: number;
  public y: number;
  public roomName: string;

  createConstructionSite(
    structureType: StructureType,
    name?: string,
  ):
    | typeof OK
    | typeof ERR_INVALID_TARGET
    | typeof ERR_FULL
    | typeof ERR_INVALID_ARGS
    | typeof ERR_RCL_NOT_ENOUGH;
  createFlag(
    name?: string,
    color?: COLORS,
    secondaryColor?: COLORS,
  ): string | typeof ERR_NAME_EXISTS | typeof ERR_INVALID_ARGS;
  findClosestByPath(
    type: FIND,
    opts?: {
      filter: Parameters<typeof _.filter>[1];
      algorithm: "astar" | "dijkstra";
    },
  ): any | null;
  findClosestByPath(
    objects: RoomPosition[],
    opts?: {
      filter: Parameters<typeof _.filter>[1];
      algorithm: "astar" | "dijkstra";
    },
  ): any | null;
  findClosestByRange(
    type: FIND,
    opts?: { filter: Parameters<typeof _.filter>[1] },
  ): any | null;
  findClosestByRange(
    objects: RoomPosition[],
    opts?: { filter: Parameters<typeof _.filter>[1] },
  ): any | null;
  findInRange(
    type: FIND,
    opts?: {
      filter: Parameters<typeof _.filter>[1];
      algorithm: "astar" | "dijkstra";
    },
  ): any | null;
  findInRange(
    objects: RoomPosition[],
    opts?: {
      filter: Parameters<typeof _.filter>[1];
      algorithm: "astar" | "dijkstra";
    },
  ): any | null;
  findPathTo(x: number, y: number, opts?: FindPathOption): Path[];
  findPathTo(target: RoomPosition, opts?: FindPathOption): Path[];
  getDirectionTo(x: number, y: number): DIRECTION;
  getDirectionTo(target: RoomPosition): DIRECTION;
  getRangeTo(x: number, y: number): boolean;
  getRangeTo(target: RoomPosition): boolean;
  inRangeTo(x: number, y: number, range: number): boolean;
  inRangeTo(target: RoomPosition, range: number): boolean;
  isEqualTo(x: number, y: number): boolean;
  isEqualTo(target: RoomPosition): boolean;
  isNearTo(x: number, y: number): boolean;
  isNearTo(target: RoomPosition): boolean;
  look(): any[];
  lookFor(type: Values<typeof LOOK>): any[];
}

type FindOption = {
  filter: Parameters<typeof _.filter>[1];
};

type FindPathOption = {
  ignoreCreeps: boolean;
  ignoreDestructibleStructures: boolean;
  ignoreRoads: boolean;
  costCallback: Function;
  ignore: any[];
  avoid: any[];
  maxOps: number;
  heuristicWeight: number;
  serialize: boolean;
  maxRooms: number;
  range: number;
  plainCost: number;
  swampCost: number;
};

interface Path {
  x: number;
  y: number;
  dx: number;
  dy: number;
  direction: DIRECTION;
}

/** 効果 */
declare type Effect = any;
/** 建物 */
declare type StructureType = string;

declare enum RETURN_CODES {
  OK = 0,
  ERR_NOT_OWNER = -1,
  ERR_NO_PATH = -2,
  ERR_NAME_EXISTS = -3,
  ERR_BUSY = -4,
  ERR_NOT_FOUND = -5,
  ERR_NOT_ENOUGH_ENERGY = -6,
  ERR_NOT_ENOUGH_RESOURCES = -6,
  ERR_INVALID_TARGET = -7,
  ERR_FULL = -8,
  ERR_NOT_IN_RANGE = -9,
  ERR_INVALID_ARGS = -10,
  ERR_TIRED = -11,
  ERR_NO_BODYPART = -12,
  ERR_NOT_ENOUGH_EXTENSIONS = -6,
  ERR_RCL_NOT_ENOUGH = -14,
  ERR_GCL_NOT_ENOUGH = -15,
}

declare enum COLORS {
  COLOR_RED = 1,
  COLOR_PURPLE = 2,
  COLOR_BLUE = 3,
  COLOR_CYAN = 4,
  COLOR_GREEN = 5,
  COLOR_YELLOW = 6,
  COLOR_ORANGE = 7,
  COLOR_BROWN = 8,
  COLOR_GREY = 9,
  COLOR_WHITE = 10,
}
