import orange from "./orange";
import purple from "./purple";
import red from "./red";
import white from "./white";
export default {
  [COLOR_RED]: red,
  [COLOR_WHITE]: white,
  [COLOR_PURPLE]: purple,
  [COLOR_ORANGE]: orange,
} as Record<ColorConstant, (flag: Flag) => unknown>;
