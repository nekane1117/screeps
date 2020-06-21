/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

module.exports = {
	/* roles*/
	/** roles ハーベスター*/
	HARVESTER: 'harvester',
	/** roles キャリアー*/
	CARRIER: 'carrier',
	/** roles クレーマー*/
	CLAIMER: 'claimer',
	/** roles アップグレーダー*/
	UPGRADER: 'upgrader',
	/** roles ビルダー*/
	BUILDER: 'builder',
	/** roles リペアラー*/
	REPAIRER: 'repairer',
	/** roles リペアラー(壁)*/
	WALL_REPAIRER: 'wallrepairer',
	/** roles リペアラー(道)*/
	ROAD_REPAIRER: 'roadrepairer',

	//number
	/** number アップグレードの射程：3*/
	UPGRADER_RANGE: 3,
	/** number 建設の射程：3*/
	BUILDER_RANGE: 3,
	/** number 修理の射程：3*/
	REPAIRER_RANGE: 3,
	/** number 輸送の射程：1*/
	TRANSFER_RANGE: 1,
	/** number クレームの射程：3*/
	CLAIM_RANGE: 1,

	//creep member
	/** creep member 役割*/
	HARVESTING: 'harvesting',
	/** creep member 役割*/
	ROLE: 'role',
	/** creep member 移動前位置*/
	PRE_POS: 'prePos',
	/** creep member 基地*/
	BASE_ROOM: 'baseRoom'

};
