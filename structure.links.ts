import { getMainSpawn } from "./util.creep";
export default function behavior(links: StructureLink[]) {
  const room = _.first(links)?.room;
  const center = room && (room.storage || getMainSpawn(room));
  if (!center) {
    return;
  }

  // 中心地に近い順に並べ替える
  const [centerLink, ...tail] = _(links)
    .sortBy((l) => {
      return l.pos.getRangeTo(center);
    })
    .value();

  tail.reverse().forEach((l) => {
    if (l.cooldown === 0 && l.store.energy >= 100) {
      l.transferEnergy(centerLink, _.floor(Math.min(l.store.energy, centerLink.store.getFreeCapacity(RESOURCE_ENERGY)), -2));
    }
  });
}
