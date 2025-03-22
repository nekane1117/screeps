import { StructureBehavior } from "structure.util";
import controller from "./structure.controller";
import extractor from "./structure.extructor";
import factory from "./structure.factory";
import terminal from "./structure.terminal";
import tower from "./structure.tower";

const structures: Partial<Record<StructureConstant, StructureBehavior>> = {
  controller,
  extractor,
  factory,
  terminal,
  tower,
};

export default structures;
