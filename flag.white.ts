/**
 * 白い旗
 * 建築物撤去用
 */
export default function behavior(flag: Flag) {
  flag.pos.lookFor(LOOK_STRUCTURES).forEach((s) => s.destroy());
  flag.remove();
}
