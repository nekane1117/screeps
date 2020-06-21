/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('flag.yellow');
 * mod.thing == 'a thing'; // true
 */

/* global LOOK_CONSTRUCTION_SITES */

//領土拡張用フラグ
var flagYellow = {
	run: function (flag) {
		//自分の部屋かどうかを判定
		if (flag.room !== undefined) {
			//自分のすぐ下を参照
			let lookObj = flag.pos.look();
			let deleteFlg = true;
			lookObj.forEach(function (lookObject) {
				if (lookObject.type === LOOK_CONSTRUCTION_SITES) {
					//建設現場があったら消さない
					deleteFlg = false;
				}

			});

			if (deleteFlg) {
				flag.remove();
			}
		}
	}

};

module.exports = flagYellow;