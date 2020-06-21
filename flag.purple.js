/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('flag.purple');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    /** 紫のフラグ 要塞を周囲9マスに作って消える*/
    run:function(flag){
        for(let x = flag.pos.x-1;x <= flag.pos.x+1;x++){
            for(let y = flag.pos.y-1;y <= flag.pos.y+1;y++){
                flag.room.createConstructionSite(x,y,STRUCTURE_RAMPART);
                flag.room.createFlag(x,y,undefined,COLOR_YELLOW,undefined);
            }
        }
        flag.remove();
    }

};