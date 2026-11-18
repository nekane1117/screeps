/**
 * オレンジの旗
 * 建築最優先
 * @param flag
 */
export default function behavior(flag: Flag) {
  // これ自身は足元にsiteが無ければ消えるだけ
  if (flag.pos.lookFor(LOOK_CONSTRUCTION_SITES).length === 0) {
    return flag.remove();
  }
  return OK;
}
