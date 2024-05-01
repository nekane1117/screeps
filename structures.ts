import controller from "./structure.controller";
export default {
  controller,
} as Partial<Record<StructureConstant, (s: Structure) => unknown>>;
