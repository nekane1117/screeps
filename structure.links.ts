import { getMainSpawn } from "./util.creep";
import { findMyStructures, getCapacityRate } from "./utils";
export default function behavior(links: StructureLink[]) {
  const room = _.first(links)?.room;
  const center = room && (room.storage || getMainSpawn(room));
  if (!center) {
    return;
  }

  // コントローラー隣接リンク
  const controllerLink = findMyStructures(room).link.find((l) => room.controller && l.pos.inRangeTo(room.controller.pos, 3));

  // 中心地に近い順に並べ替える
  const [centerLink, ...tail] = _(links)
    .filter((l) => {
      return l.id !== controllerLink?.id;
    })
    .sortBy((l) => {
      return l.pos.getRangeTo(center);
    })
    .value();

  tail.reverse().forEach((l) => {
    if (l.cooldown === 0 && l.store.energy >= 100) {
      l.transferEnergy(centerLink, _.floor(Math.min(l.store.energy, centerLink.store.getFreeCapacity(RESOURCE_ENERGY)), -2));
    }
  });

  if (getCapacityRate(centerLink) > 0.5 && controllerLink) {
    centerLink.transferEnergy(controllerLink, _.floor(Math.min(centerLink.store.energy, controllerLink.store.getFreeCapacity(RESOURCE_ENERGY)), -2));
  }
}
