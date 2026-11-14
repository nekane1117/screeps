import { StructureBehavior } from "./util";
import controller from "./controller";
import extractor from "./extractor";
// import factory from "./factory";
import terminal from "./terminal";
import tower from "./tower";

const structures: Partial<Record<StructureConstant, StructureBehavior>> = {
  controller,
  extractor,
  // factory,
  terminal,
  tower,
};

export default structures;
