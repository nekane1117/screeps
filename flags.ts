import red from "./flag.red";
import white from "./flag.white";
export default {
  [COLOR_RED]: red,
  [COLOR_WHITE]: white,
} as Record<ColorConstant, (flag: Flag) => unknown>;
