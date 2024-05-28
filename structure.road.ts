export default function behavior(road: Structure) {
  if (!isR(road)) {
    return console.log("type is invalid", JSON.stringify(road));
  }

  if (road.hits < road.hitsMax) {
    road.room.visual.text("x", road.pos, {
      opacity: _.ceil(1 - road.hits / road.hitsMax, 1),
    });
  }

  return OK;
}

function isR(s: Structure): s is StructureRoad {
  return s.structureType === STRUCTURE_ROAD;
}
