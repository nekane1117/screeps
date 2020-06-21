/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* global Creep, FIND_DROPPED_RESOURCES, FIND_STRUCTURES, STRUCTURE_STORAGE, STRUCTURE_CONTAINER, RESOURCE_ENERGY, STRUCTURE_LINK, FIND_SOURCES_ACTIVE, ERR_NOT_ENOUGH_RESOURCES, OK, ERR_NOT_FOUND, Game */

var myConst = require('MY_CONST');
var objTarget = require('obj.target');
module.exports = function () {
	/*
	 * 資源収集フラグ編集
	 */
	Creep.prototype.editHarvestFlg = function () {
		//資源収集モード
		if (!this.memory.harvesting && this.carry.energy === 0) {
			this.memory.harvesting = true;
			this.say('harvesting');
			this.memory.target = null;
		}

		//クリープごとの動作
		if (this.memory.harvesting && this.carry.energy === this.carryCapacity) {
			this.memory.harvesting = false;
			this.say(this.memory.role);
			this.memory.target = null;
		}

	};
	/*
	 * 資源収集対象の編集
	 */
	Creep.prototype.editHarvestTarget = function () {
		let resource = null;
		//ハーベスタ以外
		if (myConst.HARVESTER !== this.memory.role) {
			//貯蓄されているものを探す(自分の容量以上たまっているコンテナかストレージ、容量いっぱいのリンク)
			resource = this.pos.findClosestByPath(FIND_STRUCTURES, {
				filter: function (s) {
					return(((s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) && 50 <= s.store[RESOURCE_ENERGY])
					|| (s.structureType === STRUCTURE_LINK && (s.energy < this.carryCapacity || s.energy === s.energyCapacity)));
				}
			});
		}
		//みつからない場合
		if (resource === null) {
			//残りのある資源を探す
			resource = this.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
		}
		//見つかった場合対象を書き換える
		if (resource !== null) {
			this.memory.target = objTarget.make(resource.id, resource.name, this.pos.findPathTo(resource, {
				ignoreCreeps: this.memory.ignoreCreeps,
				serialize: true
			}));
			this.memory.ignoreCreeps = true;
		}
	};

	/*
	 * 資源収集(いろいろ自動化)
	 */
	Creep.prototype.autoHarvest = function (target) {
		//位置の判定
		if (target === null || target === undefined) {
			//何も見つかっていない場合帰る
			this.moveTo(Game.rooms[this.memory.baseRoom].controller);
			this.memory.target = null;
		} else if (this.pos.inRangeTo(target, 1)) {
			//隣接している
			switch (target.structureType) {
				case STRUCTURE_CONTAINER:
				case STRUCTURE_STORAGE:
				case STRUCTURE_LINK:
					if (ERR_NOT_ENOUGH_RESOURCES === this.withdraw(target, RESOURCE_ENERGY)) {
						//対象を初期化(再検索)
						this.memory.target = null;
					}
					break;
				default:
					if (RESOURCE_ENERGY === target.resourceType) {
						if (OK !== this.pickup(target)) {
							//成功以外は対象を初期化(再検索)
							this.memory.target = null;
						}
					} else if (OK !== this.harvest(target)) {
						//成功以外は対象を初期化(再検索)
						this.memory.target = null;
					}
					break;
			}
		} else {
			//隣接していない場合移動を試みる
			if (ERR_NOT_FOUND === this.moveByPath(this.memory.target.path)) {
				//失敗した場合対象を変更する
				this.memory.target = null;
			} else {
				//成功したが移動していない場合
				if (this.memory.prePos === null || this.memory.prePos === undefined) {
					this.memory.prePos = this.pos;
				}
				if (this.pos.isEqualTo(new RoomPosition(this.memory.prePos.x, this.memory.prePos.y, this.memory.prePos.roomName))) {
					this.memory.target = null;
					this.memory.ignoreCreeps = false;
				}
				//移動後の場所を記録する
				this.memory.prePos = new RoomPosition(this.pos.x, this.pos.y, this.pos.roomName);
			}
		}

	};

};
