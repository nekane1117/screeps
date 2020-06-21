/* global FIND_CREEPS, FIND_STRUCTURES, LOOK_TERRAIN, LOOK_STRUCTURES, Game, STRUCTURE_RAMPART, STRUCTURE_WALL, STRUCTURE_ROAD, RAMPART_DECAY_AMOUNT, STRUCTURE_CONTAINER, ROAD_DECAY_AMOUNT, CONTAINER_DECAY */
/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('structure.tower');
 * mod.thing == 'a thing'; // true
 */

var structureTower = {
	run: function (tower) {

		if (Game.time % 10000 === 0) {
			makeWall(tower);
		}
		//攻撃・回復→修理
		//「ダメージを受けている味方」か「敵」
		let target = tower.pos.findClosestByRange(FIND_CREEPS, {
			filter: function (c) {
				return((c.hits < c.hitsMax && c.my) || !c.my);
			}
		});


		//みつかった場合
		if (target !== null) {
			//エネルギーが最低以上ある
			if (10 < tower.energy) {
				//敵か味方か
				if (target.my) {
					//味方は回復
					tower.heal(target);
				} else {
					//敵に攻撃
					tower.attack(target);
				}
				return;
			}
		} else {
			//みつからなかった場合
			target = tower.room.find(FIND_STRUCTURES, {
				//HitsがDECAY_AMOUNT以下のものを最優先
				filter: function (s) {
					return((s.structureType === STRUCTURE_ROAD && s.hits <= ROAD_DECAY_AMOUNT * 10)
					|| (s.structureType === STRUCTURE_RAMPART && s.hits <= RAMPART_DECAY_AMOUNT * 2)
					|| (s.structureType === STRUCTURE_CONTAINER && s.hits <= CONTAINER_DECAY * 2)
					);
				}

			}).sort(function (t1, t2) {
				//Hitsで昇順ソート
				if (t2.hits !== t1.hits) {
					return (t1.hits - t2.hits);
				} else if (t1.ticksToDecay !== undefined) {
					return (t1.ticksToDecay - t2.ticksToDecay);
				} else {
					return 0;
				}

			});

			if (0 === target.length && tower.energyCapacity * 0.8 <= tower.energy) {
				//それ以外の場合にはエネルギーが十分にある時だけ直す
				target = tower.room.find(FIND_STRUCTURES, {
					//ダメージを受けている構造物
					filter: function (s) {
						return(s.hits < s.hitsMax);
					}

				}).sort(function (t1, t2) {
					//Hitsで昇順ソート
					if (t2.hits !== t1.hits) {
						return (t1.hits - t2.hits);
					} else if (t1.ticksToDecay !== undefined) {
						return (t1.ticksToDecay - t2.ticksToDecay);
					} else {
						return 0;
					}

				});

			}

			//あったら修理
			if (0 < target.length) {
				tower.repair(target[0]);
			}
		}
	}
};

function makeWall(tower) {
	//周囲8近傍を見る
	let nextArea = tower.room.lookAtArea(tower.pos.y - 1, tower.pos.x - 1, tower.pos.y + 1, tower.pos.x + 1);
	//周囲を見る2重ループ
	for (let x = tower.pos.x - 1; x <= tower.pos.x + 1; x++) {
		for (let y = tower.pos.y - 1; y <= tower.pos.y + 1; y++) {
			//その場所のオブジェクトを取得
			let lookObj = nextArea[y][x];
			//要塞の作成判定
			let wallFlg = true;

			//各要素を検証
			lookObj.forEach(function (o) {
				switch (o.type) {
					//地面の属性
					case LOOK_TERRAIN:
						//属性が壁
						if ('wall' === o[LOOK_TERRAIN]) {
							//作らなくていい
							wallFlg = false;
						}
						break;
						//構造物
					case LOOK_STRUCTURES:
						//構造物による分岐
						switch (o[LOOK_STRUCTURES].structureType) {
							//要塞と壁は作らなくていい
							case STRUCTURE_RAMPART:
							case STRUCTURE_WALL:
								wallFlg = false;
								break;
							default:
								break;
						}
						break;

					default:
						break;
				}
			});

			//何もない場合は要塞を建てる
			if (wallFlg) {
				tower.room.createConstructionSite(x, y, STRUCTURE_RAMPART);
			}

		}
	}
}

module.exports = structureTower;