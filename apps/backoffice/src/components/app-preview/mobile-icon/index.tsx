import { Box } from "@mui/material";
import * as SVGIcon from "../../../../public/mobile/icons";
import { MOBILE_COLOR_BLUE_IO_500 } from "../components";

type MobileIconProps = {
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
  color?: string;
  height: number;
};

const MobileIcon = ({
  icon,
  color = "currentColor",
  width,
  height
}: MobileIconProps) => {
  const IconComponent = SVGIcon[icon];

  return (
    <Box
      id="mobile-icon-wrapper"
      display="flex"
      justifyContent="center"
      alignItems="center"
      width={width}
      height={height}
      sx={{
        fill: color
      }}
    >
      <IconComponent />
    </Box>
  );
};
export default MobileIcon;
