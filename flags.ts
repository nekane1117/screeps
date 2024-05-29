import red from "./flag.red";
import white from "./flag.white";
import purple from "./flag.purple";
export default {
  [COLOR_RED]: red,
  [COLOR_WHITE]: white,
  [COLOR_PURPLE]: purple,
} as Record<ColorConstant, (flag: Flag) => unknown>;
