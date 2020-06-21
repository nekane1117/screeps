/* global STRUCTURE_LINK, FIND_MY_STRUCTURES, FIND_MY_SPAWNS */
/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('structure.link');
 * mod.thing == 'a thing'; // true
 */

var structureLink = {
	run: function (link) {
		//一つ目のスポーンを探す
		let spawns = link.room.find(FIND_MY_SPAWNS);
		if (0 < spawns.length) {
			//一つ目のスポーン
			let spawn = spawns[0];

			//自分以外でスポーンに最寄りのリンク
			let spawnLink = spawn.pos.findClosestByRange(FIND_MY_STRUCTURES, {
				filter: function (s) {
					return(STRUCTURE_LINK === s.structureType);
				}

			});

			//みつかった場合
			if (spawnLink !== null && link.id !== spawnLink.id) {
				//空き
				let emp = spawnLink.energyCapacity - spawnLink.energy;
				//要求量(空きの100単位換算)
				let req = emp - (emp % 100);
				//送れる量
				let snd = link.energy - (link.energy % 100);

				//少ない方の量で送る
				link.transferEnergy(spawnLink, Math.min(req, snd));
			}
		}
	}
};

module.exports = structureLink;