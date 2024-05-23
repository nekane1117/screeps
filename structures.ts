import tower from "./structure.tower";
import controller from "./structure.controller";

export type StructureBehavior = (creep: Structure) => unknown;

const structures: Partial<Record<StructureConstant, StructureBehavior>> = {
  tower,
  controller,
};

export default structures;
