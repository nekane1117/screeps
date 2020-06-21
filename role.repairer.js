/* global FIND_STRUCTURES, STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_CONTAINER, STRUCTURE_STORAGE, Room, Game, ERR_NOT_FOUND, FIND_MY_STRUCTURES, RESOURCE_ENERGY, FIND_MY_SPAWNS, ERR_FULL, _, FIND_MY_CONSTRUCTION_SITES, OK, STRUCTURE_ROAD, STRUCTURE_WALL, STRUCTURE_RAMPART */
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

//const
var myConst = require('MY_CONST');

var roleRepairer = {
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


/* 修理対象の編集
 * @param {Creep} creep
 */
function editTarget(creep) {
	//エネルギー不足のタワー
	var target = creep.room.find(FIND_STRUCTURES, {
		filter: function (s) {
			return (s.energy < s.energyCapacity * 0.9 && s.structureType === STRUCTURE_TOWER);
		}

	});

	//存在しなかった場合
	if (0 === target.length) {
		//Hitsの減っているすべての構造物
		target = creep.room.find(FIND_STRUCTURES, {
			filter: function (s) {
				return(s.hits < s.hitsMax);
			}
		}).sort(function (t1, t2) {
			//Hitsで昇順ソート
			if (t2.hits !== t1.hits) {
				return (t1.hits - t2.hits);
			} else if (t1.ticksToDecay !== undefined) {
				return (t1.ticksToDecay - t2.ticksToDecay);
			} else {
				return 0;
			}
		});
	}

	if (0 < target.length) {
		//対象があった場合、対象を取得
		creep.memory.target = objTarget.make(target[0].id, target[0].name, Room.serializePath(creep.pos.findPathTo(target[0])));
	}
}

/* 実際の動作
 * @param {Creep} creep
 */
function work(creep) {
	//動作
	if (creep.memory.target === null) {
		if (creep.pos.inRangeTo(creep.room.controller, myConst.UPGRADER_RANGE)) {
			creep.upgradeController(creep.room.controller);
		}
		if (creep.pos.inRangeTo(creep.room.controller, 1)) {
			creep.moveTo(creep.room.controller);
		}

	} else {
		let target = Game.getObjectById(creep.memory.target.id);
		if (creep.memory.harvesting) {
			//資源収集モードの場合
			creep.autoHarvest(target);
		} else {
			//修理モードの場合
			if (target === null) {
				//対象がなくなっていたら対象を初期化
				creep.memory.target = null;
			} else if (target.structureType === STRUCTURE_TOWER && creep.pos.inRangeTo(target, myConst.TRANSFER_RANGE)) {
				//対象がタワーで隣接している
				//エネルギーを渡す
				if (OK !== creep.transfer(target, RESOURCE_ENERGY)) {
					//失敗したらなんかアラートを出す
					console.log('TRANSFER FAILD!');
				}
				//初期化(毎回)
				creep.memory.target = null;
			} else if (target.structureType !== STRUCTURE_TOWER && creep.pos.inRangeTo(target, myConst.REPAIRER_RANGE)) {
				//射程内の場合
				//修理を行う
				if (OK !== creep.repair(target)) {
					//失敗したらなんかアラートを出す
					console.log('REPAIRING FAILD!');
				}
				//初期化(毎回)
				creep.memory.target = null;
			} else {
				//射程外の場合移動を試みる
				if (ERR_NOT_FOUND === creep.moveByPath(creep.memory.target.path)) {
					//失敗した場合対象を変更する
					creep.memory.target = null;
				} else {
					//成功したが移動していない場合
					if (creep.pos.isEqualTo(new RoomPosition(creep.memory.prePos.x, creep.memory.prePos.y, creep.memory.prePos.roomName))) {
						//対象をnullにする
						creep.memory.target = null;
					}
					creep.memory.prePos = creep.pos;
				}
			}
		}
	}
}

module.exports = roleRepairer;