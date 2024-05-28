import controller from "./structure.controller";
import extractor from "./structure.extructor";
import road from "./structure.road";
import tower from "./structure.tower";

export type StructureBehavior = (structure: Structure) => unknown;

const structures: Partial<Record<StructureConstant, StructureBehavior>> = {
  controller,
  extractor,
  road,
  tower,
};

export default structures;
