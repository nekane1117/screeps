import { getMainSpawn } from "./util.creep";
import { getCapacityRate } from "./utils";

export default function behavior(links: StructureLink[]) {
  const spawn = (() => {
    const room = _.first(links)?.room;
    return room && getMainSpawn(room);
  })();

  if (!spawn) {
    return ERR_NOT_FOUND;
  }

  const extracter = spawn.pos.findClosestByRange(links);
  if (!extracter) {
    return ERR_NOT_FOUND;
  }
  if (getCapacityRate(extracter) > 0.5) {
    return ERR_FULL;
  }
  return links.map((link) => {
    if (getCapacityRate(link) > 0.9) {
      return link.transferEnergy(extracter);
    } else {
      return ERR_NOT_ENOUGH_ENERGY;
    }
  });
}
