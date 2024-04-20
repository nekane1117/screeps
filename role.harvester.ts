import { CreepBehavior } from "./roles";
import { isStoreTarget } from "./util.creep";

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
      const directions = [
        TOP_LEFT,
        TOP,
        TOP_RIGHT,
        LEFT,
        RIGHT,
        BOTTOM_LEFT,
        BOTTOM,
        BOTTOM_RIGHT,
      ];
      return creep.move(directions[_.random(0, directions.length - 1)]);
    }

    // この辺から実際の動き
    if (creep.pos.isNearTo(target)) {
      // 隣接しているとき渡してみる
      return creep.transfer(target, RESOURCE_ENERGY);
    } else {
      // 離れてるときはpathに従って移動して終わる
      return creep.moveTo(target, { ignoreCreeps: true });
    }
  } else {
    // 空きがあるとき
    if (!creep.memory.target) {
      creep.memory.target = creep.room.memory.activeSource[0];
    }
    const sources = Game.getObjectById(creep.memory.target);

    if (!sources) {
      return ERR_NOT_FOUND;
    }

    if (creep.pos.isNearTo(sources)) {
      const returnVal = creep.harvest(sources);
      if (returnVal !== OK) {
        creep.memory.target = undefined;
      }
      return returnVal;
    } else {
      if (creep.fatigue) {
        return OK;
      }
      // 離れてるときは移動する
      const returnVal = creep.moveTo(sources, {
        // 3マスより離れているときはcreepを無視する
        ignoreCreeps: !creep.pos.inRangeTo(sources, 3),
      });
      if (returnVal !== OK) {
        creep.memory.target = undefined;
      }
      return returnVal;
    }
  }
};

export default behavior;

function isHarvester(creep: Creeps): creep is Harvester {
  return creep.memory.role === "harvester";
}
