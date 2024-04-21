import { CreepBehavior } from "./roles";
import { complexOrder } from "./util.array";
import {
  RETURN_CODE_DECODER,
  customMove,
  isStoreTarget,
  randomWalk,
} from "./util.creep";

const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isBuilder(creep)) {
    return console.log(`${creep.name} is not Builder`);
  }

  if (creep.memory.building) {
    // 建設モード
    if (!creep.memory.buildingId) {
      // 対象が無いときはいい感じの対象を探す
      creep.memory.buildingId = _.first(
        complexOrder(creep.room.find(FIND_MY_CONSTRUCTION_SITES), [
          (c1, c2) => {
            // 建築優先順位
            return (
              getBuildPriority(c1.structureType) -
              getBuildPriority(c2.structureType)
            );
          },
          (c1, c2) => {
            // 残り作業が一番少ないやつ
            return (
              c1.progressTotal - c1.progress - (c2.progressTotal - c2.progress)
            );
          },
          (c1, c2) => {
            // 一番近いやつ
            return (
              creep.pos.findPathTo(c1, { ignoreCreeps: true }).length -
              creep.pos.findPathTo(c2, { ignoreCreeps: true }).length
            );
          },
        ]),
      )?.id;
    }
    if (!creep.memory.buildingId) {
      // 見つからないときは終わる
      creep.say("no sites");
      return randomWalk(creep);
    }

    const site = Game.getObjectById(creep.memory.buildingId);
    if (site) {
      const returnVal = creep.build(site);
      switch (returnVal) {
        case ERR_NOT_IN_RANGE:
          return customMove(creep, site);
        case ERR_NOT_ENOUGH_RESOURCES:
          // 色々初期化して資源収集モードへ
          creep.memory.building = false;
          creep.memory.buildingId = undefined;
          creep.memory.storeId = undefined;
          return;

        case OK:
          return;
        case ERR_NOT_OWNER:
        case ERR_BUSY:
        case ERR_INVALID_TARGET:
        case ERR_NO_BODYPART:
        default:
          // 無視するやつ
          return creep.say(RETURN_CODE_DECODER[returnVal]);
      }
    } else {
      // 建設が見つからないときは対象をクリアして終わる
      creep.say("site not found");
      creep.memory.buildingId = undefined;
    }
  } else {
    // 資源収集モード

    // 対象が無ければ入れる
    if (!creep.memory.storeId) {
      creep.memory.storeId = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        // 複数種類のfindが出来ないのでStructureでfindしてfilterで絞る
        ignoreCreeps: true,
        filter: (s: Structure): s is StoreTarget => {
          // StorageTargetかつエネルギーがある
          return isStoreTarget(s) && !!s.store[RESOURCE_ENERGY];
        },
      })?.id;
    }

    // 対象が全くない時
    if (!creep.memory.storeId) {
      return creep.say("empty all");
    }

    const target = Game.getObjectById(creep.memory.storeId);
    if (!target) {
      return ERR_NOT_FOUND;
    }

    // 取り出してみる
    switch (creep.withdraw(target, RESOURCE_ENERGY)) {
      // 離れていた時
      case ERR_NOT_IN_RANGE:
        customMove(creep, target);
        break;

      case OK: // 取れたとき
      case ERR_NOT_ENOUGH_RESOURCES: // 無いとき
      case ERR_FULL: // 満タンの時
        // 満タンになったか、空になったかのどっちかしかないので消す
        creep.memory.storeId = undefined;
        randomWalk(creep);
    }
    // 適当に容量が8割を超えてたらアップグレードモードにする
    if (
      creep.store.getUsedCapacity(RESOURCE_ENERGY) /
        creep.store.getCapacity(RESOURCE_ENERGY) >
      0.8
    ) {
      creep.memory.building = true;
      creep.memory.storeId = undefined;
    }
  }
};

export default behavior;

function isBuilder(creep: Creep): creep is Builder {
  return creep.memory.role === "builder";
}

const buildPriority: StructureConstant[] = [
  STRUCTURE_EXTENSION,
  STRUCTURE_ROAD,
];
const getBuildPriority = (s: StructureConstant) => {
  const priority = buildPriority.findIndex((p) => s === p);
  return priority === -1 ? buildPriority.length : priority;
};
