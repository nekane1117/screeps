import tower from "./structure.tower";

export type StructureBehavior = (creep: Structure) => unknown;

const structures: Partial<Record<StructureConstant, StructureBehavior>> = {
  tower,
};

export default structures;
