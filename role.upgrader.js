/* global FIND_STRUCTURES, STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_CONTAINER, STRUCTURE_STORAGE, Room, Game, ERR_NOT_FOUND, FIND_MY_STRUCTURES, RESOURCE_ENERGY, FIND_MY_SPAWNS, ERR_FULL, _, OK */
/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.harvester');
 * mod.thing == 'a thing'; // true
 */
//prototype
require('prototype.creep')();
var objTarget = require('obj.target');

//CONST
var myConst = require('MY_CONST');

var roleUpgrader = {
	/* 処理実行
	 * @param {Creep} creep
	 */
	run: function (creep) {
		//フラグ編集
		creep.editHarvestFlg();

		//対象がnullの場合対象を編集する
		if (creep.memory.target === null) {
			if (creep.memory.harvesting) {
				creep.editHarvestTarget();
			} else {
				editTarget(creep);

			}
		}

		//動作
		work(creep);
	}
};


/*
 * コントローラーを検索
 * @param {Creep} creep
 */
function editTarget(creep) {
	let controller = creep.room.controller;
	creep.memory.target = objTarget.make(controller.id, controller.name, Room.serializePath(creep.pos.findPathTo(controller)));
}

/* 実際の動作
 * @param {Creep} creep
 */
function work(creep) {
	//動作
	if (creep.memory.target === null) {
		//回る
		creep.move(1 + Game.time % 8);
	} else {
		let target = Game.getObjectById(creep.memory.target.id);
		if (creep.memory.harvesting) {
			//資源収集モードの場合
			creep.autoHarvest(target);
		} else {
			//アップグレードの場合
			if (creep.pos.inRangeTo(target, myConst.UPGRADER_RANGE)) {
				//射程内の場合アップグレード
				if (OK !== creep.upgradeController(target)) {
					//何かしら失敗した場合
					console.log('UPGRADING FAILED!');
				}
			} else {
				//隣接していない場合移動を試みる
				if (ERR_NOT_FOUND === creep.moveByPath(creep.memory.target.path)) {
					//失敗した場合対象を変更する
					creep.memory.target = null;
				} else {
					//成功したが移動していない
					if (creep.pos.isEqualTo(new RoomPosition(creep.memory.prePos.x, creep.memory.prePos.y, creep.memory.prePos.roomName))) {
						creep.memory.target = null;
					}
					creep.memory.prePos = creep.pos;
				}
			}
		}
	}
}

module.exports = roleUpgrader;