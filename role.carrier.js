/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.carrier');
 * mod.thing == 'a thing'; // true
 */

/* global FIND_STRUCTURES, STRUCTURE_CONTAINER, STRUCTURE_STORAGE, RESOURCE_ENERGY, STRUCTURE_LINK, Room, STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER, FIND_MY_SPAWNS, Game, ERR_FULL, ERR_NOT_FOUND, _, FIND_MY_STRUCTURES, TOP_LEFT, BOTTOM_RIGHT, BOTTOM, TOP_RIGHT, RIGHT, BOTTOM_LEFT, LEFT, TOP, FIND_FLAGS, COLOR_WHITE */

//prototype
require('prototype.creep')();
var objTarget = require('obj.target');

var roleCarrier = {

	/* 処理実行
	 * @param {Creep} creep
	 */
	run: function (creep) {
		//フラグ編集
		creep.editHarvestFlg();

		//対象がnullの場合対象を編集する
		if (creep.memory.target === null) {
			if (creep.memory.harvesting) {
				editWithdrawTarget(creep);
			} else {
				editTarget(creep);

			}
		}

		//動作
		work(creep);
	}
};

/* 資源分収集先の編集
 * @param {Creep} creep
 */
function editWithdrawTarget(creep) {

	let target = null;
	let targets = creep.room.find(FIND_STRUCTURES, {
		//エネルギーを持っているコンテナかストレージ
		//または満タンのリンク
		filter: function (s) {
			return (((s.structureType === STRUCTURE_CONTAINER
			|| s.structureType === STRUCTURE_STORAGE) && 0 < s.store[RESOURCE_ENERGY])
			|| (s.structureType === STRUCTURE_LINK && 50 <= s.energy));
		}
	}).sort(function (s1, s2) {
		let s1Eng = 0;
		switch (s1.structureType) {
			//コンテナかストレージの場合
			case STRUCTURE_CONTAINER:
			case STRUCTURE_STORAGE:
				s1Eng = s1.store[RESOURCE_ENERGY];

				break;
				//リンクの場合
			case STRUCTURE_LINK:
				s1Eng = s1.energy;
				break;
		}
		let s2Eng = 0;
		switch (s2.structureType) {
			//コンテナかストレージの場合
			case STRUCTURE_CONTAINER:
			case STRUCTURE_STORAGE:
				s2Eng = s2.store[RESOURCE_ENERGY];

				break;
				//リンクの場合
			case STRUCTURE_LINK:
				s2Eng = s2.energy;
				break;
		}

		//降順ソート
		return s2Eng - s1Eng;
	});

	//みつかった場合最大のものを対象とする
	if (0 < targets.length) {
		target = targets[0];
	}
	//みつかった場合書き換える
	if (target !== null) {
		//対象を書き換える
		const tmpPath = creep.pos.findPathTo(target)
		creep.memory.target = objTarget.make(target.id, target.name, Room.serializePath(tmpPath));
		new RoomVisual(creep.room.name)
            .poly(
                tmpPath,
                {
                    stroke: '#fff',
                    strokeWidth: .15,
                    opacity: .2,
                    lineStyle: 'dashed'
                });

	}

}
/* 資源分配先の編集
 * @param {Creep} creep
 */
function editTarget(creep) {
	let target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
		//満タンでないスポーン、エクステンション
		filter: function (s) {
			return(s.energy < s.energyCapacity
			&& (s.structureType === STRUCTURE_EXTENSION
			|| s.structureType === STRUCTURE_SPAWN));
		}
	});

	//みつからなかった場合
	if (target === null) {
		//貯蔵量の最も少ないストレージかコンテナを検索
		let storages = creep.room.find(FIND_STRUCTURES, {
			//満タンでないストレージかコンテナ
			filter: function (s) {
				return(_.sum(s.store) < s.storeCapacity
				&& (s.structureType === STRUCTURE_STORAGE
				|| s.structureType === STRUCTURE_CONTAINER));
			}
		}).sort(function (s1, s2) {
			//貯蓄量で昇順ソート
			return(_.sum(s1.store) - _.sum(s2.store));
		});

		if (storages.length !== 0) {
			target = storages[0];
		}
	}

	//みつからなかった場合
	if (target === null) {
		//ゲーム全体から空きのストレージを探す
		let storages = _.filter(Game.structures, (s) => {
			return (_.sum(s.store) < s.storeCapacity && s.structureType === STRUCTURE_STORAGE
			);
		});

		if (storages.length !== 0) {
			target = storages[0];
		}
	}

	//みつかった場合書き換える
	if (target !== null) {
		//対象を書き換える
		creep.memory.target = objTarget.make(target.id, target.name, Room.serializePath(creep.pos.findPathTo(target)));
	}
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
		if (target === null || target === undefined) {
			creep.memory.target = null;
		} else if (creep.memory.harvesting) {
			//資源収集モードの場合
			creep.autoHarvest(target);
		} else {
			//資源分配モードの場合
			if (creep.pos.inRangeTo(target, 1)) {
				//隣接している場合分配してみる
				if (ERR_FULL === creep.transfer(target, RESOURCE_ENERGY)) {
					//既に満杯だった場合対象の再編集
					creep.memory.target = null;
				}
			} else {
				//隣接していない場合移動を試みる
				if (ERR_NOT_FOUND === creep.moveByPath(creep.memory.target.path)) {
					//失敗した場合対象の再編集
					creep.memory.target = null;
				} else {
					//成功したが移動していない場合対象の再編集
					if (creep.pos.isEqualTo(new RoomPosition(creep.memory.prePos.x, creep.memory.prePos.y, creep.memory.prePos.roomName))) {
						creep.memory.target = null;
					}
					creep.memory.prePos = new RoomPosition(creep.pos.x, creep.pos.y, creep.pos.roomName);
				}
			}
		}
	}
}


module.exports = roleCarrier;