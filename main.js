/* global STRUCTURE_TOWER, STRUCTURE_EXTENSION, Memory, Game, FIND_MY_SPAWNS, FIND_MY_CONSTRUCTION_SITES, MAX_CONSTRUCTION_SITES, FIND_HOSTILE_CREEPS, FIND_STRUCTURES, WORK, CARRY, MOVE, STRUCTURE_STORAGE, OK, FIND_MY_CREEPS, CREEP_LIFE_TIME, STRUCTURE_LINK, COLOR_GREY, FIND_SOURCES, COLOR_YELLOW */

/*roles*/
var roleHarvester = require('role.harvester');
var roleCarrier = require('role.carrier');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleRepairer = require('role.repairer');
var roleWallRepairer = require('role.wallrepairer');
var roleRoadRepairer = require('role.roadrepairer');
var roleClaimer = require('role.claimer');

/*flags*/
/**flag gray*/
var flagGray = require('flag.gray');
/**flag yellow*/
var flagYellor = require('flag.yellow');
var flagPurple = require('flag.purple');

/*structures*/
var structureTower = require('structure.tower');
var structureLink = require('structure.link');

var creepMaker = require('CreepMaker');
var StructureMaker = require('StructureMaker');
var roadLayer = require('RoadLayer');

//const
var myConst = require('MY_CONST');

var MY_CONST_AUTO_CONSTRUCTION = [STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_STORAGE];

module.exports.loop = function () {

	//死んだcreepは削除する
	for (let name in Memory.creeps) {
		if (!Game.creeps[name]) {
			delete Memory.creeps[name];
			console.log('Clearing non-existing creep memory:', name);
		}
	}

	//すべての部屋に対して処理を行う
	for (let roomName in Game.rooms) {
		var room = Game.rooms[roomName];
		if (undefined === room.controller.safeMode) {
			let res = room.controller.activateSafeMode();
			if (OK === res) {
				console.log('Safe Mode Activated');
			}
		}

		let cSite = room.find(FIND_MY_CONSTRUCTION_SITES);
		//建設予定がない
		if (Game.time % 100 === 0 && cSite.length < MAX_CONSTRUCTION_SITES / 2) {
			//最初に自動建設
			for (let i = 0; i < MY_CONST_AUTO_CONSTRUCTION.length; i++) {
				//自動生成
				StructureMaker.run(room, MY_CONST_AUTO_CONSTRUCTION[i]);

			}
		}

		//次に資源への道をしく(間隔は現時点では大体半日)
		if (Game.time % 10000 === 0 && cSite.length < MAX_CONSTRUCTION_SITES / 2) {
			//始点
			let spawn = room.find(FIND_MY_SPAWNS);
			//資源リスト
			let sources = room.find(FIND_SOURCES);
			sources.forEach(function (source) {
				roadLayer.run(room, spawn[0].pos, source.pos);
				roadLayer.run(room, room.controller.pos, source.pos);
			});

			//スポーン同士
			for (let name1 in Game.spawns) {
				let spawn1 = Game.spawns[name1]
				for (let name2 in Game.spawns) {
					let spawn2 = Game.spawns[name2]
					if (spawn1.id !== spawn2.id) {
						roadLayer.run(spawn1.room, spawn1.pos, spawn2.pos);
					}

				}
			}
		}
		//creppの作成
		creepMaker.run(room);
	}

	//constructionSites main
	if (Game.time % CREEP_LIFE_TIME === 0) {
		for (let name in Game.constructionSites) {
			let cSite = Game.constructionSites[name];

			let lookObj = cSite.pos.lookFor(LOOK_FLAGS);

			if (lookObj.length === 0) {
				cSite.pos.createFlag(undefined, COLOR_YELLOW);
			}
		}
	}

	//spawn main
//	for (let name in Game.spawns) {
//		let spawn = Game.spawns[name];
//	}

	//structures main
	for (let id in Game.structures) {
		let str = Game.structures[id];
		switch (str.structureType) {
			case STRUCTURE_TOWER:
				structureTower.run(str);
				break;

			case STRUCTURE_LINK:
				structureLink.run(str);
				break;

			default:
				break;
		}
	}

	//flag main
	for (let name in Game.flags) {
		let flag = Game.flags[name];
		switch (flag.color) {
			case COLOR_YELLOW:
				flagYellor.run(flag);
				break;
			case COLOR_GREY:
				flagGray.run(flag);
				break;
			case COLOR_PURPLE:
				flagPurple.run(flag);
				break;
		}
	}

	//creeps main
	for (let name in Game.creeps) {
		let creep = Game.creeps[name];
		if (creep.fatigue === 0) {
			switch (creep.memory.role) {
				case myConst.HARVESTER:
					roleHarvester.run(creep);
					break;

				case myConst.CARRIER:
					roleCarrier.run(creep);
					break;

				case myConst.UPGRADER:
					roleUpgrader.run(creep);
					break;

				case myConst.BUILDER:
					roleBuilder.run(creep);
					break;

				case myConst.REPAIRER:
					roleRepairer.run(creep);
					break;

				case myConst.WALL_REPAIRER:
					roleWallRepairer.run(creep);
					break;

				case myConst.ROAD_REPAIRER:
					roleRoadRepairer.run(creep);
					break;

				case myConst.CLAIMER:
					roleClaimer.run(creep);
					break;

				default:
					creep.memory.role = myConst.HARVESTER;
					roleHarvester.run(creep);
			}
		}
	}

};