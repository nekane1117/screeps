/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.claimer');
 * mod.thing == 'a thing'; // true
 */

/* global FIND_STRUCTURES, STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_CONTAINER, STRUCTURE_STORAGE, Room, Game, ERR_NOT_FOUND, FIND_MY_STRUCTURES, RESOURCE_ENERGY, FIND_MY_SPAWNS, ERR_FULL, _, OK, COLOR_GREY, STRUCTURE_CONTROLLER */


//prototype
require('prototype.creep')();
var objTarget = require('obj.target');

//CONST
var myConst = require('MY_CONST');

var roleClaimer = {
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
	//flags
	/**GRAY(領土拡張用) @param {Flag} flag **/
	var flgGry = _.filter(Game.flags, (flag) => flag.color === COLOR_GREY);

	/** 対象のコントローラー */
	let target = null;

	if (flgGry.length !== 0) {
		//フラグがあった場合,1つ目のフラグを対象とする
		targetFlg = flgGry[0];
		//フラグと同じ部屋にいるか
		if (targetFlg.pos.roomName === creep.pos.roomName) {
			//同じ部屋にいる場合
			target = creep.room.controller;
		} else {
			target = targetFlg;
		}
	} else {
		//フラグがなかった場合、ビルダーになる
		creep.memory.role = myConst.BUILDER;
		creep.memory.baseRoom = creep.room.name
	}

	//対象を書き換える
	creep.memory.target = objTarget.make(target.id, target.name, Room.serializePath(creep.pos.findPathTo(target)));
}

/* 実際の動作
 * @param {Creep} creep
 */
function work(creep) {
	//動作
	if (creep.memory.target === null) {
		//スポーン
		let spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
		if (spawn !== null) {
			creep.moveTo(spawn);
		}
	} else {
		let target = Game.getObjectById(creep.memory.target.id);
		if (target === null) {
			target = Game.flags[creep.memory.target.name];
		}

		if (target === null || target === undefined) {
			creep.memory.target = null;
		} else if (creep.memory.harvesting) {
			//資源収集モードの場合
			creep.autoHarvest(target);
		} else {
			//クレームの場合
			if (creep.pos.inRangeTo(target, myConst.CLAIM_RANGE)) {
				//射程内の場合クレーム
				let res = creep.claimController(target);
				if (OK !== res) {
					//何かしら失敗した場合
					console.log('CLAIMING FAILED!:' + res);
					creep.memory.target = null;
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
					//コントローラー以外の場合は移動後に初期化
					if (target.structureType !== STRUCTURE_CONTROLLER) {
						creep.memory.target = null;
					}
				}
			}
		}
	}
}

module.exports = roleClaimer;