import { getMainSpawn } from "./util.creep";
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
  return links
    .filter((l) => l.id !== extracter.id)
    .map((link) => {
      const amount = _.floor(Math.min(extracter.store.getFreeCapacity(RESOURCE_ENERGY), link.store.energy), -2);
      if (amount > 0) {
        return link.transferEnergy(extracter, amount);
      } else {
        return ERR_NOT_ENOUGH_ENERGY;
      }
    });
}
