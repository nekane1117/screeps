/* global FIND_STRUCTURES, CONTROLLER_STRUCTURES, FIND_MY_SPAWNS, OK , Room, FIND_MY_CONSTRUCTION_SITES*/

var roadLayer = require('RoadLayer');

var StructureMaker = {
	/** @param {Room} room **/
	/** @param {number} numStructureType **/
	run: function (room, numStructureType) {
		//対象の構造物の数
		let cntStr = room.find(FIND_STRUCTURES, {filter: function (s) {
				return (s.structureType === numStructureType);
			}}).length;

		let cntCsite = room.find(FIND_MY_CONSTRUCTION_SITES, {filter: function (s) {
				return (s.structureType === numStructureType);
			}}).length;
		//対象の構造物の上限数
		let maxStr = CONTROLLER_STRUCTURES[numStructureType][room.controller.level];
		//現時点の所持数が最大未満の場合
		if (cntStr + cntCsite < maxStr) {
			//スポーンを探す
			let mySpawn = room.find(FIND_MY_SPAWNS);
			//スポーンからの距離
			for (let dist = 1; dist < 25; dist++) {
				//距離分の2重ループ
				for (let dy = -dist; dy <= dist; dy++) {
					for (let dx = -dist; dx <= dist; dx++) {
						//差分の絶対値の合計が偶数かつエリアからはみ出ていないの場合
						if ((Math.abs(dx) + Math.abs(dy)) % 2 === 0
						&& (Math.abs(dx) + Math.abs(dy)) === dist
						&& 0 < mySpawn[0].pos.x + dx
						&& 0 < mySpawn[0].pos.y + dy
						&& mySpawn[0].pos.x + dx < 50
						&& mySpawn[0].pos.y + dy < 50
						) {
							let tgtPos = new RoomPosition(mySpawn[0].pos.x + dx, mySpawn[0].pos.y + dy, room.name);
							//指定の位置に建設
							if (room.createConstructionSite(mySpawn[0].pos.x + dx, mySpawn[0].pos.y + dy, numStructureType) === OK) {
								//作ったものまで道をひく
								roadLayer.run(room, mySpawn[0].pos, tgtPos);

								//結果がOKの場合ループを抜ける
								return;
							}
						}
					}
				}
			}
		}
	}
};

module.exports = StructureMaker;