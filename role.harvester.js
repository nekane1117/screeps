/* global FIND_STRUCTURES, STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_CONTAINER, STRUCTURE_STORAGE, Room, Game, ERR_NOT_FOUND, FIND_MY_STRUCTURES, RESOURCE_ENERGY, FIND_MY_SPAWNS, ERR_FULL, _, STRUCTURE_LINK, ERR_NOT_IN_RANGE, FIND_SOURCES, ERR_NOT_ENOUGH_ENERGY, OK */
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
var myConst = require('MY_CONST');
var roleHarvester = {
	/* 処理実行
	 * @param {Creep} creep
	 */
	run: function (creep) {
		//動作(harvest,transfer)
		work(creep);
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

		//移動
		if (creep.fatigue === 0) {
			moving(creep);
		}

	}
};
/* 実際の動作
 * @param {Creep} creep
 */
function work(creep) {
	//動作
	if (creep.memory.target === null || creep.memory.target === undefined) {
	    //対象を検索する
        creep.memory.target = null;
	} else {
		let target = Game.getObjectById(creep.memory.target.id);
		//対象ごとの動作
		if (target === null) {
			//検索結果がみつからない場合再検索
			creep.memory.target = null;
		} else if (creep.memory.harvesting) {
			//資源収集モードの場合
			//隣接している場合は収集を行う
			if (creep.pos.isNearTo(target)) {
				if (OK !== creep.harvest(target)) {
					//なんかエラーの場合再検索
					creep.memory.target = null;
				}
			}
			//保持してるエネルギーが50より多い場合
			if (50 < creep.carry.energy) {
				//最寄りのコンテナ,ストレージ,リンクを探す
				let storage = creep.pos.findClosestByRange(FIND_STRUCTURES, {
					filter: function (s) {
						return (s.structureType === STRUCTURE_CONTAINER
						|| s.structureType === STRUCTURE_STORAGE
						|| s.structureType === STRUCTURE_LINK);
					}
				});
				//隣接している場合は渡してしまう
				if (creep.pos.isNearTo(storage)) {
					creep.transfer(storage, RESOURCE_ENERGY);
				}

			}
		} else {
			//資源分配モードの場合
			//隣接している場合は収集を行う
			if (creep.pos.isNearTo(target)) {
				//隣接している場合分配してみる
				if (ERR_FULL === creep.transfer(target, RESOURCE_ENERGY)) {
					//既に満杯だった場合
					creep.memory.target = null;
				}
			}
		}
	}
}

/* 資源分配先の編集
 * @param {Creep} creep
 */
function editTarget(creep) {
	//満タンではないコンテナかストレージかリンク
	let targets = creep.pos.findClosestByPath(FIND_STRUCTURES, {
		filter: function (s) {
			return(_.sum(s.store) < s.storeCapacity && (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE)
			|| (s.energy < s.energyCapacity && s.structureType === STRUCTURE_LINK))
			;
		}
	});
	//見つからなかった場合その他の貯蓄先を探す
	if (targets === null) {
		targets = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
			filter: function (s) {
				return(s.energy < s.energyCapacity
				&& (s.structureType === STRUCTURE_EXTENSION
				|| s.structureType === STRUCTURE_SPAWN
				|| s.structureType === STRUCTURE_TOWER));
			}
		});
	}

	//見つかった場合は書き換える
	if (targets !== null) {
		//対象を書き換える
		creep.memory.target = objTarget.make(targets.id, targets.name, creep.pos.findPathTo(targets, {
			ignoreCreeps: creep.memory.ignoreCreeps,
			serialize: true
		}));
		creep.memory.ignoreCreeps = true;
	}
}

function moving(creep) {
	//対象の取得
	if (creep.memory.target === null || creep.memory.target === undefined) {
		//見つからなければ一番最初に復活するソースに向かう
		let source = creep.room.find(FIND_SOURCES).sort(function(s1,s2){
			return s1.ticksToRegeneration - s2.ticksToRegeneration;
		});
		if(source !== null){
			creep.moveTo(source);
		}
	} else {
		let target = Game.getObjectById(creep.memory.target.id);
		//みつかった場合、隣接していなければ向かう
		if (!creep.pos.isNearTo(target)) {
			if (ERR_NOT_FOUND === creep.moveByPath(creep.memory.target.path)) {
				//失敗した場合対象を変更する
				creep.memory.target = null;
			} else {
				//成功したが移動していない
				if (creep.pos.isEqualTo(new RoomPosition(creep.memory.prePos.x, creep.memory.prePos.y, creep.memory.prePos.roomName))) {
					//対象の再検索
					creep.memory.target = null;
					//クリープを無視しない
					creep.memory.ignoreCreeps = false;
				}
				creep.memory.prePos = new RoomPosition(creep.pos.x, creep.pos.y, creep.pos.roomName);
			}
		}
	}
}

module.exports = roleHarvester;