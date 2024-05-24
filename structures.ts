import tower from "./structure.tower";
import controller from "./structure.controller";
import extractor from "./structure.extructor";

export type StructureBehavior = (structure: Structure) => unknown;

const structures: Partial<Record<StructureConstant, StructureBehavior>> = {
  tower,
  controller,
  extractor,
};

export default structures;
