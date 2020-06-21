/* global WORK, CARRY, MOVE, CLAIM */

//const
var myConst = require('MY_CONST');

var BASE_ENG_HARVESTER = 200;
var BASE_ENG_WORKER = 200;
var BASE_ENG_CARRIER = 100;
var BASE_ENG_CLAIMER = 800;

var bodyMaker = {
	run: function (eng, role) {
		var body = new Array();

		switch (role) {
			//ハーベスター
			//アップグレーダー
			//ビルダー
			//リペアラー各種
			case myConst.HARVESTER:
			case myConst.UPGRADER:
			case myConst.BUILDER:
			case myConst.REPAIRER:
			case myConst.ROAD_REPAIRER:
			case myConst.WALL_REPAIRER:
				//基本の形
				body.push(WORK);
				body.push(CARRY);
				body.push(MOVE);
				//BASE_ENG_WORKERを超える場合
				for (var cnt = 0; cnt < Math.floor((eng - BASE_ENG_WORKER) / 100); cnt++) {
					if (Math.round(Math.random())) {
						body.push(WORK);
					} else {
						body.push(CARRY);
						body.push(MOVE);
					}
				}
				break;
				//キャリアー
			case myConst.CARRIER:
				body.push(CARRY);
				body.push(MOVE);
				for (var cnt = 0; cnt < Math.floor((eng - BASE_ENG_CARRIER) / 50); cnt++) {
					if (Math.round(Math.random())) {
						body.push(CARRY);
					} else {
						body.push(MOVE);
					}
				}
				break;
				//クレーマー
			case myConst.CLAIMER:
				body.push(MOVE);
				body.push(CARRY);
				body.push(WORK);
				body.push(CLAIM);
				for (var cnt = 0; cnt < Math.floor((eng - BASE_ENG_CLAIMER) / 50); cnt++) {
					if (Math.round(Math.random())) {
						body.push(CARRY);
					} else {
						body.push(MOVE);
					}
				}
				break;

		}
		return body;
	}
};

module.exports = bodyMaker;