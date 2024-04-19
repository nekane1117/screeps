// import roleHarvester from "role.harvester";
// import roleUpgrader from "role.upgrader";

module.exports.loop = function () {
  for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    if (creep.memory.role == "harvester") {
      console.log("harvester");
    }
  }
};
