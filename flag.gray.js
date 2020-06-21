/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('flag.gray');
 * mod.thing == 'a thing'; // true
 */

/* global STRUCTURE_SPAWN, OK, COLOR_YELLOW */

//領土拡張用フラグ
var flagGray = {
	run: function (flag) {
		//自分の部屋かどうかを判定
		if (flag.room !== undefined) {
			//スポーンを建設
			let res = flag.room.createConstructionSite(flag.pos, STRUCTURE_SPAWN);
			if (OK === res) {
				flag.setColor(COLOR_YELLOW);
			} else {
				//console.log(flag.name + ' is Construction failed:error code ' + res);
			}
		}
	}

};

module.exports = flagGray;