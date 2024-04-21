import { CreepBehavior } from "./roles";
import {
  commonHarvest,
  customMove,
  isStoreTarget,
  randomWalk,
} from "./util.creep";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isHarvester(creep)) {
    return console.log(`${creep.name} is not Harvester`);
  }

  if (creep.store.getFreeCapacity() === 0) {
    // 満タンの時

    const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      // 複数種類のfindが出来ないのでStructureでfindしてfilterで絞る
      ignoreCreeps: true,
      filter: (s: Structure): s is StoreTarget => {
        // StorageTargetかつ空きがある
        return isStoreTarget(s) && !!s.store.getFreeCapacity(RESOURCE_ENERGY);
      },
    });

    if (!target) {
      creep.say("all container is full");
      return randomWalk(creep);
    }

    // この辺から実際の動き
    if (creep.pos.isNearTo(target)) {
      // 隣接しているとき渡してみる
      return creep.transfer(target, RESOURCE_ENERGY);
    } else {
      // 離れてるときはpathに従って移動して終わる
      return customMove(creep, target);
    }
  } else {
    return commonHarvest(creep);
  }
};

export default behavior;

function isHarvester(creep: Creeps): creep is Harvester {
  return creep.memory.role === "harvester";
}
