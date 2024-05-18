import red from "./flag.red";
export default {
  [COLOR_RED]: red,
} as Record<ColorConstant, (flag: Flag) => unknown>;
