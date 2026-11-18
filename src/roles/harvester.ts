import { findMyStructures } from "../utils";
import { RETURN_CODE_DECODER, customMove, getMainSpawn, moveRoom, pickUpAll, toColor } from "../utils/creep";

/**
 * sourceにとりついて資源を取り続けるだけで移動しない
 * 無いと困るので自分の周囲の建築だけする
 */
const behavior: CreepBehavior = (creep: Creeps) => {
  if (!isHarvester(creep)) {
    console.log(`${creep.name} is not harvester`);
    return ERR_INVALID_TARGET;
  }

  // 違う部屋にいたらとりあえず目的の部屋に行く
  if (creep.room.name !== creep.memory.baseRoom) {
    const targetRoom = Game.rooms[creep.memory.baseRoom];
    creep.say(targetRoom ? "GOTO " + targetRoom.name : "invisible room");
    if (targetRoom) {
      const source = targetRoom.controller || _.first(targetRoom.find(FIND_SOURCES)) || new RoomPosition(25, 25, targetRoom.name);
      return customMove(creep, source);
    } else {
      return moveRoom(creep, creep.room.name, creep.memory.baseRoom);
    }
  }

  const moveMeTo = (target: RoomPosition | _HasRoomPosition, opt?: MoveToOpts) => {
    const pos = "pos" in target ? target.pos : target;
    Game.rooms[pos.roomName]?.visual.text("x", pos, {
      color: toColor(creep),
    });
    PathFinder.use(true);
    const result = customMove(creep, target, {
      maxRooms: 1,
      ...opt,
    });
    PathFinder.use(false);
    return result;
  };

  const { container = [], link = [] } = findMyStructures(creep.room);

  //#region 収穫処理 #####################################################################################
  // harvest
  const source = Game.getObjectById(creep.memory.harvestTargetId);
  // 無いわけはないので無かったらリサイクル
  if (!source) {
    const spawn = getMainSpawn(creep.room);
    if (spawn) {
      if (spawn.pos.isNearTo(creep)) {
        spawn.recycleCreep(creep);
      } else {
        moveMeTo(spawn);
      }
    }
    return;
  }
  creep.memory.worked = creep.harvest(source);

  switch (creep.memory.worked) {
    case ERR_NOT_IN_RANGE:
      moveMeTo(source, {
        range: 1,
        maxRooms: 0,
      });
      break;
    // 来ないはずのやつ
    case ERR_INVALID_TARGET: // 対象が変
    case ERR_NOT_OWNER: // 自creepじゃない
    case ERR_NOT_FOUND: // mineralは対象外
    case ERR_NO_BODYPART: // WORKが無い
      // とりあえずログを出して終わる
      console.log(`${creep.name} harvest returns ${RETURN_CODE_DECODER[creep.memory.worked.toString()]}`);
      creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
      break;
    // 大丈夫なやつ
    case OK: // OK
    case ERR_NOT_ENOUGH_RESOURCES: // 空っぽ
      break;
    case ERR_TIRED: // 疲れた
    case ERR_BUSY: // spawning
    default:
      creep.say(RETURN_CODE_DECODER[creep.memory.worked.toString()]);
      break;
  }

  // 周囲にコンテナもリンクもなければコンテナを建てる
  if (
    creep.memory.worked === OK &&
    source.pos.findInRange([...source.room.find(FIND_CONSTRUCTION_SITES, { filter: (s) => s.structureType === STRUCTURE_CONTAINER }), ...container, ...link], 2)
      .length === 0 &&
    creep.pos.roomName === creep.memory.baseRoom
  ) {
    creep.pos.createConstructionSite(STRUCTURE_CONTAINER);
  }
  //#endregion 収穫処理 ##################################################################################

  pickUpAll(creep);

  //#region 分配 ##################################################################################
  // 手持ちがいっぱいの時で建設があるときは建てる
  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) < creep.getActiveBodyparts(WORK) * 2) {
    const site = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
      filter: (s) =>
        s.structureType === STRUCTURE_CONTAINER ||
        s.structureType === STRUCTURE_LINK ||
        s.structureType === STRUCTURE_SPAWN ||
        s.structureType === STRUCTURE_EXTENSION,
    });
    if (site) {
      creep.build(site);
    }
  }

  // 道以外の最大じゃなくてなんか壊れそうなやつは直す
  // 壊れると困るのでビルダー有無にかかわらず直す
  const damaged = creep.pos.findClosestByRange(FIND_STRUCTURES, {
    filter: (s) => {
      return s.structureType !== STRUCTURE_ROAD && creep.pos.isNearTo(s) && s.hits < s.hitsMax && s.hits <= CONTAINER_DECAY;
    },
  });
  if (damaged) {
    creep.repair(damaged);
  }

  // 適当にぶん投げる
  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.getActiveBodyparts(WORK) * BUILD_POWER) {
    const availableLink = link.find((l) => creep.pos.isNearTo(l) && l.store.energy < l.store.getCapacity(RESOURCE_ENERGY));

    // 空きのあるリンクがある場合
    if (availableLink) {
      const nearContainer = container.find((c) => c.store.energy > 0 && creep.pos.isNearTo(c));
      // コンテナから吸ってリンクに投げる
      if (nearContainer) {
        creep.withdraw(nearContainer, RESOURCE_ENERGY);
      }
      creep.transfer(availableLink, RESOURCE_ENERGY);
    } else {
      const nearContainer = container.find((c) => c.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && creep.pos.isNearTo(c));
      if (nearContainer) {
        creep.transfer(nearContainer, RESOURCE_ENERGY);
      }
    }
  }
  //#endregion 収穫処理 ##################################################################################
};

export default behavior;

function isHarvester(c: Creeps): c is Harvester {
  return "role" in c.memory && c.memory.role === "harvester";
}
