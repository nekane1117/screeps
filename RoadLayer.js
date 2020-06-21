/* global PathFinder, Game, FIND_STRUCTURES, STRUCTURE_ROAD, FIND_MY_CONSTRUCTION_SITES, LOOK_CONSTRUCTION_SITES */
/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('RoadLayer');
 * mod.thing == 'a thing'; // true
 */

var roadLayer = {
	/** param {Room} room*/
	/** param {RoomPosition} start*/
	/** param {RoomPosition} end*/
	run: function (room, start, end) {
		//建設対象までのパスを検索
		PathFinder.use(true);
		let roadPath = room.findPath(start, end, {

			//これから道を敷くので関係ない
			ignoreCreeps: true,
			ignoreDestructibleStructures: false,
			ignoreRoads: false,
			plainCost: 5,
			swampCost: 1,

			costCallback: function (roomName, costMatrix) {
				let tmproom = Game.rooms[roomName];
				if (tmproom)
					return;
				let costs = new PathFinder.CostMatrix;

				//道以外の構造物はよける
				tmproom.find(FIND_STRUCTURES, {
					filter: function (s) {
						return STRUCTURE_ROAD !== s.structureType;

					}

				}).forEach(function (s) {
					costMatrix.set(s.pos.x, s.pos.y, 0xff);

				});

				//道になるところは道と同じ
				tmproom.find(FIND_MY_CONSTRUCTION_SITES, {
					filter: function (s) {
						return STRUCTURE_ROAD === s.structureType;

					}

				}).forEach(function (s) {
					costMatrix.set(s.pos.x, s.pos.y, 1);

				});

			}

		});
		//算出したパスに道を引く
		for (let i = 0; i < roadPath.length; i++) {
			//参照先がすでに道の場合は無視
			let looks = room.lookAt(roadPath[i].x, roadPath[i].y);
			looks.forEach(function (obj) {
				//建設条件
				if (LOOK_CONSTRUCTION_SITES !== obj.type) {
					//建設予定がない場合は建てる
					room.createConstructionSite(roadPath[i].x, roadPath[i].y, STRUCTURE_ROAD);
				}
			});

		}
	}
};

module.exports = roadLayer;