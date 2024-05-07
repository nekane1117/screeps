import container from "./structure.container";
import tower from "./structure.tower";

export type StructureBehavior = (creep: Structure) => unknown;

const structures: Partial<Record<StructureConstant, StructureBehavior>> = {
  storage: container,
  container,
  tower,
};

export default structures;
