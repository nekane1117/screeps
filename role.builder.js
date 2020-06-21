/* global FIND_STRUCTURES, STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_CONTAINER, STRUCTURE_STORAGE, Room, Game, ERR_NOT_FOUND, FIND_MY_STRUCTURES, RESOURCE_ENERGY, FIND_MY_SPAWNS, ERR_FULL, _, FIND_MY_CONSTRUCTION_SITES, OK, COLOR_YELLOW */
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

var roleBuilder = {
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


/* 対象の編集
 * @param {Creep} creep
 */
function editTarget(creep) {
	// 同室内で一番残りが少ない建設予定地
	let target = Game
	                .constructionSites[
	                    Object.keys(Game.constructionSites)
                            .filter(cid=>Game.constructionSites[cid].room.name === creep.room.name)
                            .sort((id1,id2)=>{
                                const c1 = Game.constructionSites[id1];
                                const c2 = Game.constructionSites[id2];
                                return (c1.progressTotal - c1.progress) - (c2.progressTotal - c2.progress)
                        })[0]
                    ];

	//自室内にない場合は黄色のフラグ
	//みつからなかった場合最寄りの建設予定地
	if (target === undefined) {
		/**YELLOW(建設現場用) @param {Flag} flag **/
		var flgYlw = _.filter(Game.flags, (flag) => flag.color === COLOR_YELLOW);
		if (flgYlw.length !== 0) {
			//フラグがあった場合,1つ目のフラグを対象とする
			target = flgYlw[0];
		}
	}

	//みつかった場合書き換え
	if (target !== null) {
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
        } else {
		let newRole = '';
		let num = Math.random() * 3;
		if (num < 1) {
			newRole = myConst.ROAD_REPAIRER;
		} else if (num < 2) {
			newRole = myConst.WALL_REPAIRER;
		} else {
			newRole = myConst.REPAIRER;
		}
		creep.say(newRole);
		console.log(creep.memory.role + '->' + newRole);
		creep.memory.role = newRole;
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
		//みつからない場合フラグとみなしてフラグから検索する
		if(target === null && creep.memory.target.name !== null){
			target = Game.flags[creep.memory.target.name];
		}

		if (creep.memory.harvesting) {
			//資源収集モードの場合
			creep.autoHarvest(target);
		} else {
			//建設モードの場合
			if (target === null || target === undefined) {
				//建設が終了していた場合対象を初期化
				creep.memory.target = null;
			} else if (creep.pos.inRangeTo(target, myConst.BUILDER_RANGE)) {
				//射程内の場合建設を行う
				if (target.pos.isEqualTo(creep.pos)) {
					//重なっている場合ランダムウォーク
					creep.move(1 + Math.round(Math.random() * 7));
				} else if (OK !== creep.build(target)) {
					creep.say('FAILD');
					console.log(creep.name + ':BUILDING FAILD!' + target);
					creep.memory.target = null;
				}
			} else {
				//射程の場合移動を試みる
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

					//対象が建設現場以外の場合は再建策
					if(target.structureType === undefined){
						creep.memory.target = null;
					}
				}
			}
		}
	}
}

module.exports = roleBuilder;