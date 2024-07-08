import AvatarLogo from "./avatar-logo";
import { MobileButton } from "./mobile-button";
import { MobileIcon } from "./mobile-icon";
import { MobileTypography } from "./mobile-typography";

export { AvatarLogo, MobileButton, MobileIcon, MobileTypography };

function asIOColors<T extends { [key: string]: string }>(arg: T): T {
  return arg;
}

export const IOColors = asIOColors({
  black: "#0E0F13",
  white: "#FFFFFF",
  "grey-50": "#F4F5F8",
  "grey-100": "#E8EBF1",
  "grey-300": "#BBC2D6",
  "grey-650": "#636B82",
  "grey-700": "#555C70",
  "grey-850": "#2B2E38",
  "blueIO-500": "#0B3EE3"
});

export type IOColors = keyof typeof IOColors;
