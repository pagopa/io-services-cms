import { ArrowBackRounded, QuestionMarkRounded } from "@mui/icons-material";
import { Box } from "@mui/material";
import { MOBILE_COLOR_GREY_850, MobileTypography } from "../../components";
import MobileIcon from "../../mobile-icon";

type ServicePreviewTopbarProps = {
  serviceName?: string;
  opacity: number;
};

/** Display App IO top navigation bar */
const ServicePreviewTopbar = ({
  opacity,
  serviceName
}: ServicePreviewTopbarProps) => {
  return (
    <Box
      height={56}
      flexDirection="row"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      paddingY={2}
      paddingX={3}
      sx={{ backgroundColor: `rgb(244,245,248,${1 - opacity})` }}
    >
      <MobileIcon
        icon="MobileIconArrowBack"
        width={24}
        height={24}
        color={MOBILE_COLOR_GREY_850}
      />

      <MobileTypography
        noWrap
        fontSize={14}
        fontWeight={400}
        lineHeight="33px"
        textOverflow="ellipsis"
        sx={{
          opacity: opacity
        }}
      >
        {serviceName}
      </MobileTypography>
      <MobileIcon
        icon="MobileIconQMark"
        width={16}
        height={24}
        color={MOBILE_COLOR_GREY_850}
      />
    </Box>
  );
};

export default ServicePreviewTopbar;
