import { StructureBehavior } from "./structures";

const behavior: StructureBehavior = (road: Structure) => {
  if (!isR(road)) {
    return console.log("type is invalid", road);
  }
};

export default behavior;
function isR(s: Structure): s is StructureRoad {
  return s.structureType === STRUCTURE_ROAD;
}
