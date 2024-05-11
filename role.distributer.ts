import { CreepBehavior } from "./roles";
import { RETURN_CODE_DECODER, customMove, pickUpAll } from "./util.creep";
import { findMyStructures, getCapacityRate } from "./utils";

const behavior: CreepBehavior = (creep: Creeps) => {
  const moveMeTo = (target: RoomPosition | _HasRoomPosition) =>
    customMove(creep, target, {
      ignoreCreeps: !creep.pos.inRangeTo(target, 2),
    });

  if (!isDistributer(creep)) {
    return console.log(`${creep.name} is not Harvester`);
  }

  // 担当資源
  const source = Game.getObjectById(creep.memory.sourceId);

  // sourceが見つからないときは死ぬ
  if (!source) {
    return creep.suicide();
  }
  // 最寄りのコンテナ
  const closestContainer = source?.pos.findClosestByRange(findMyStructures(creep.room).container);

  // コンテナが見つからないときは終わる
  if (!source || !closestContainer) {
    return ERR_NOT_FOUND;
  }

  // https://docs.screeps.com/simultaneous-actions.html

  return (
    _(OK)
      .tap(() => {
        const capacityRate = getCapacityRate(creep);
        if (capacityRate < 0.25) {
          // 空っぽになったら収集モードに切り替える
          changeMode(creep, "🛒");
        } else if (capacityRate === 1) {
          // 満タンだったら分配モードにしておく
          changeMode(creep, "💪");
        }
      })
      // withdraw
      .tap(() => {
        // 収集モードの時
        if (creep.memory.mode === "🛒") {
          // 近寄る判定
          if (!creep.pos.isNearTo(closestContainer)) {
            moveMeTo(closestContainer);
          }

          // 取り出す
          if (creep.pos.isNearTo(closestContainer)) {
            creep.memory.worked = creep.withdraw(closestContainer, RESOURCE_ENERGY);
            switch (creep.memory.worked) {
              // 有りえない系
              case ERR_NOT_IN_RANGE: // 先に判定してるので
              case ERR_NOT_OWNER:
              case ERR_INVALID_TARGET:
              case ERR_INVALID_ARGS:
                console.log(`${creep.name} withdraw returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
                creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
                break;

              // 問題ない系
              case OK:
              case ERR_FULL: // お腹いっぱい
              case ERR_BUSY:
              case ERR_NOT_ENOUGH_RESOURCES: // 空の時
              default:
                break;
            }
          }
        }
        // 満タンだったら分配モードに切り替える
        if (getCapacityRate(creep) === 1) {
          changeMode(creep, "💪");
        }
      })
      // transfer
      .tap(() => {
        if (creep.memory.mode === "💪") {
          const spawn = creep.pos.findClosestByRange(Object.values(Game.spawns));
          if (!spawn) {
            console.log(`${creep.name} : SPAWN NOT FOUND`);
            return creep.say("SPAWN NOT FOUND");
          }

          // 輸送先が設定されていなければ設定する
          if (!creep.memory.transferId) {
            // 自分からspawnまでの距離
            const rangeToSpawn = creep.pos.getRangeTo(spawn);

            // 放り込む先
            const { container, extension, link, storage, spawn: spawns } = findMyStructures(creep.room);
            if (!creep.memory.transferId)
              creep.memory.transferId = (
                source.pos.findInRange(FIND_STRUCTURES, 3, {
                  filter: (s): s is StructureLink => {
                    return s.structureType === STRUCTURE_LINK && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                  },
                })?.[0] ||
                creep.pos.findClosestByRange([...spawns, ...container, ...extension, ...link, ...storage], {
                  filter: (s: StructureExtension | StructureLink | StructureStorage | StructureContainer) => {
                    // 最寄りコンテナ以外で空きがあり自分よりもspawnに近いやつ
                    return s.id !== closestContainer.id && getCapacityRate(s) < 1 && s.pos.getRangeTo(spawn) < rangeToSpawn;
                  },
                })
              )?.id;
          }
          // それでもないときはとりあえず自分のコンテナに寄っておく
          if (!creep.memory.transferId) {
            return moveMeTo(closestContainer);
          }

          const transferTarget = Game.getObjectById(creep.memory.transferId);
          if (!transferTarget) {
            // なぜか見つからないときは対象を消して終わる
            return (creep.memory.transferId = undefined);
          }

          // 近寄る
          if (!creep.pos.isNearTo(transferTarget)) {
            moveMeTo(transferTarget);
          }

          // 渡す
          if (creep.pos.isNearTo(transferTarget)) {
            const returnVal = creep.transfer(transferTarget, RESOURCE_ENERGY);
            switch (returnVal) {
              // 手持ちがない
              case ERR_NOT_ENOUGH_RESOURCES: // 値を指定しないから多分発生しない
                changeMode(creep, "🛒");
                break;

              // 対象が変
              case ERR_INVALID_TARGET: // 対象が変
              case ERR_FULL: // 満タン
                creep.memory.transferId = undefined;
                break;

              // 有りえない系
              case ERR_NOT_IN_RANGE: // 先に判定してるのでないはず
              case ERR_NOT_OWNER: // 自creepじゃない
              case ERR_INVALID_ARGS: // 引数が変
                console.log(`${creep.name} transfer returns ${RETURN_CODE_DECODER[returnVal.toString()]}`);
                creep.say(RETURN_CODE_DECODER[returnVal.toString()]);
                break;

              // 問題ない系
              case OK:
              case ERR_BUSY: // spawining
              default:
                break;
            }
          }
        }
      })
      // 届く範囲で落ちてるものは拾っておく
      .tap(() => {
        pickUpAll(creep);
      })
      .run()
  );
};

export default behavior;

function isDistributer(creep: Creeps): creep is Distributer {
  return creep.memory.role === "distributer";
}

function changeMode(creep: Distributer, mode: DistributerMemory["mode"]) {
  if (creep.memory.mode !== mode) {
    creep.say(mode);
    creep.memory.mode = mode;
    creep.memory.transferId = undefined;
  }
}
