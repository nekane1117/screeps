/* global FIND_STRUCTURES, STRUCTURE_WALL, STRUCTURE_ROAD, FIND_SOURCES, Game, _, FIND_MY_CONSTRUCTION_SITES, FIND_MY_STRUCTURES, FIND_MY_SPAWNS, ERR_NAME_EXISTS, MOVE, CARRY, WORK, LOOK_CREEPS, ERR_NOT_ENOUGH_ENERGY, STRUCTURE_RAMPART, STRUCTURE_CONTAINER, STRUCTURE_STORAGE, COLOR_GREY, FIND_MY_CREEPS */

//prototype
var bodyMaker = require('BodyMaker');

//const
var myConst = require('MY_CONST');

var CreepMaker = {
	/** @param {Room} room **/
	run: function (room) {

		//それぞれの数
		//資源
		var sourcesCnt = room.find(FIND_SOURCES).length;

		//creeps
		/**ハーベスターの数 */
		var cntHav = 0;
		/**キャリアの数 */
		var cntCar = 0;
		/**アップグレーダーの数 */
		var cntUpg = 0;
		/**ビルダーの数 */
		var cntBld = 0;
		/**リペアラーの数 */
		var cntRep = 0;
		/**リペアラー(壁)の数 */
		var cntWrp = 0;
		/**リペアラー(道)の数 */
		var cntRrp = 0;
		/**クレーマーの数 */
		var cntClm = 0;

		//クリープ全部をカウント
		for (let name in Game.creeps) {
			let creep = Game.creeps[name];
			//生まれた部屋が対象の部屋
			if (creep.memory[myConst.BASE_ROOM] === room.name) {
				//各ロールごとに分岐してカウント
				switch (creep.memory.role) {
					case myConst.HARVESTER:
						cntHav++;
						break;
					case myConst.CARRIER:
						cntCar++;
						break;
					case myConst.UPGRADER:
						cntUpg++;
						break;
					case myConst.BUILDER:
						cntBld++;
						break;
					case myConst.REPAIRER:
						cntRep++;
						break;
					case myConst.WALL_REPAIRER:
						cntWrp++;
						break;
					case myConst.ROAD_REPAIRER:
						cntRrp++;
						break;
					case myConst.CLAIMER:
						cntClm++;
						break;
				}
			}
		}

		//flags
		/**GRAY(領土拡張用) @param {Flag} flag **/
		var cntGry = _.filter(Game.flags, (flag) => flag.color === COLOR_GREY).length;

		//structures
		//コンテナ
		var cntCntainer = room.find(FIND_STRUCTURES, {
			filter: function (s) {
				return(s.structureType === STRUCTURE_CONTAINER
				|| s.structureType === STRUCTURE_STORAGE);
			}
		}).length;


		//それぞれの
		/** ハーベスタ目標値:リソース * 4 */
		var targetHav = sourcesCnt * 4;
		/** キャリア目標値:リソース * 2 */
		var targetCar = sourcesCnt * 1;
		/** アップグレーダ目標値: レベル * 1.5 */
		var targetUpg = Math.round(room.controller.level * 1.5);
		/** ビルダー目標値:ワールド全体で必要な時 2 不要なら 0 */
		var targetBld = Object.keys(Game.constructionSites).length * 1.5;
		/** リペアラー必要な時 2 不要なら 0 */
		var targetRep = room.find(FIND_STRUCTURES, {
			filter: function (s) {
				return (s.hits < s.hitsMax
				&& (s.structureType !== STRUCTURE_ROAD
				&& s.structureType !== STRUCTURE_WALL
				&& s.structureType !== STRUCTURE_RAMPART
				));
			}

		}).length > 0 ? 2 : 0;

		/** リペアラー(壁)目標値: 1 不要なら 0 */
		var targetWal = room.find(FIND_STRUCTURES, {
			filter: function (s) {
				return (s.hits < s.hitsMax && (s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART));
			}
		}).length > 0 ? 1 : 0;

		/** リペアラー(道)目標値: 1 不要なら 0 */
		var targetRod = room.find(FIND_STRUCTURES, {
			filter: function (s) {
				return (s.hits < s.hitsMax * 0.8 && s.structureType === STRUCTURE_ROAD);
			}

		}).length > 0 ? 1 : 0;

		/** 作成対象のロール */
		var makeCreep = '';
		//作成対象の判定
		if (room.energyAvailable < 300) {
			//必要エネルギーが最低未満の場合は作らない
			makeCreep = '';
		} else if (cntHav < targetHav) {
			//まずハーベスター
			makeCreep = myConst.HARVESTER;
		} else if (cntCar < targetCar && cntCntainer !== 0) {
			//コンテナがあってキャリアがないときはキャリア
			makeCreep = myConst.CARRIER;
		} else if (cntUpg === 0) {
			//アップグレーダ
			makeCreep = myConst.UPGRADER;
		} else if (cntBld < targetBld) {
			//ビルダー
			makeCreep = myConst.BUILDER;
		} else if (cntRrp < targetRod) {
			//道修理
			makeCreep = myConst.ROAD_REPAIRER;
		} else if (cntRep < targetRep) {
			//建物修理
			makeCreep = myConst.REPAIRER;
		} else if (cntWrp < targetWal) {
			//壁修理
			makeCreep = myConst.WALL_REPAIRER;
		} else if (cntUpg < targetUpg) {
			//アップグレーダ
			makeCreep = myConst.UPGRADER;
		} else if (room.energyAvailable < 800) {
			//必要エネルギーが最低未満の場合は作らない
			makeCreep = '';
		} else if (cntClm < cntGry) {
			//クレーマーを作る
			makeCreep = myConst.CLAIMER;
		}

		if (makeCreep !== '') {
			//スポーン
			let mySpawns = room.find(FIND_MY_SPAWNS);
			for (let i = 0; i < mySpawns.length; i++) {
				if (mySpawns[i].spawning === null) {
					let cnt = 0;
					while (ERR_NAME_EXISTS === mySpawns[i].canCreateCreep([WORK, CARRY, MOVE],  room.name + '_' +makeCreep + cnt)) {
						cnt++;
					}
					let body = bodyMaker.run(room.energyAvailable, makeCreep);
					console.log(room.energyAvailable + '/' + room.energyCapacityAvailable + '->' + body);
					console.log(room.name + ':' +
					myConst.HARVESTER + ':' + cntHav + '/' + targetHav + ':' +
					myConst.CARRIER + ':' + cntCar + '/' + targetCar + ':' +
					myConst.UPGRADER + ':' + cntUpg + '/' + targetUpg + ':' +
					myConst.BUILDER + ':' + cntBld + '/' + targetBld + ':' +
					myConst.REPAIRER + ':' + cntRep + '/' + targetRep + ':' +
					myConst.WALL_REPAIRER + ':' + cntWrp + '/' + targetWal + ':' +
					myConst.ROAD_REPAIRER + ':' + cntRrp + '/' + targetRod + ':' +
					myConst.CLAIMER + ':' + cntClm + '/' + cntGry + ':' +
					'Make->' + room.name + '_' + makeCreep + cnt);

					if (ERR_NOT_ENOUGH_ENERGY === mySpawns[i].createCreep(body, room.name + '_' +makeCreep + cnt, {
						role: makeCreep,
						baseRoom: mySpawns[i].room.name,
						prePos: mySpawns[i].pos
					})) {
						mySpawns[i].createCreep([WORK, CARRY, MOVE], room.name + '_' +makeCreep + cnt, {role: makeCreep});
					}
				}
			}
		} else {
			if (Game.time % 100 === 0) {
					console.log(room.name + ':' +
					myConst.HARVESTER + ':' + cntHav + '/' + targetHav + ':' +
					myConst.CARRIER + ':' + cntCar + '/' + targetCar + ':' +
					myConst.UPGRADER + ':' + cntUpg + '/' + targetUpg + ':' +
					myConst.BUILDER + ':' + cntBld + '/' + targetBld + ':' +
					myConst.REPAIRER + ':' + cntRep + '/' + targetRep + ':' +
					myConst.WALL_REPAIRER + ':' + cntWrp + '/' + targetWal + ':' +
					myConst.ROAD_REPAIRER + ':' + cntRrp + '/' + targetRod + ':' +
					myConst.CLAIMER + ':' + cntClm + '/' + cntGry + ':' +
					room.energyAvailable + '/' + room.energyCapacityAvailable);

			}

		}
	}
};

module.exports = CreepMaker;