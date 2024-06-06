import { StructureBehavior } from "./structures";

const behavior: StructureBehavior = (road: Structure) => {
  if (Game.time % 1000) {
    /// 1000で割れないときはしない
    return;
  }
  if (!isR(road)) {
    return console.log("type is invalid", road);
  }
  const {
    room: {
      memory: { roadMap },
    },
    pos,
  } = road;

  const border = 1000;
  const current = Game.time - roadMap[pos.y * 50 + pos.x];
  if (border < current) {
    road.destroy();
  }
};

export default behavior;
function isR(s: Structure): s is StructureRoad {
  return s.structureType === STRUCTURE_ROAD;
}
