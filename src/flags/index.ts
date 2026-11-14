import red from "./red";
import white from "./white";
import purple from "./purple";
export default {
  [COLOR_RED]: red,
  [COLOR_WHITE]: white,
  [COLOR_PURPLE]: purple,
} as Record<ColorConstant, (flag: Flag) => unknown>;
