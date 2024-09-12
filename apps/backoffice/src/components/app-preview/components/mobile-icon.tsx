import { Box } from "@mui/material";

import * as SVGIcon from "../../../../public/mobile/icons";

interface MobileIconProps {
  color?: string;
  height: number;
  icon:
    | "MobileIconAddress"
    | "MobileIconArrowBack"
    | "MobileIconChecks"
    | "MobileIconCopy"
    | "MobileIconCustomerCare"
    | "MobileIconEmail"
    | "MobileIconFiscalCode"
    | "MobileIconId"
    | "MobileIconMenu"
    | "MobileIconMessage"
    | "MobileIconNotification"
    | "MobileIconPec"
    | "MobileIconPhoneApp"
    | "MobileIconPhoneCall"
    | "MobileIconQMark"
    | "MobileIconSecurity"
    | "MobileIconWebsite";
  width: number;
}

export const MobileIcon = ({
  color = "currentColor",
  height,
  icon,
  width,
}: MobileIconProps) => {
  const IconComponent = SVGIcon[icon];

  return (
    <Box
      alignItems="center"
      display="flex"
      height={height}
      id="mobile-icon-wrapper"
      justifyContent="center"
      sx={{
        fill: color,
      }}
      width={width}
    >
      <IconComponent />
    </Box>
  );
};
