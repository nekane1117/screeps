import controller from "./structure.controller";
import container from "./structure.container";
export default {
  controller,
  container,
} as Partial<Record<StructureConstant, (s: Structure) => unknown>>;
