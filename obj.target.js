/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('obj.target');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
	make: function (_id,_name, _path) {
		return ({
			/** id 対象のID */
			id: _id,
			/** name 対象の名前 */
			name: _name,
			/** path 対象へのパス */
			path: _path
		});
	}
};