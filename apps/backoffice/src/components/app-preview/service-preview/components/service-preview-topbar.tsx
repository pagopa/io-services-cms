import { ArrowBackRounded, QuestionMarkRounded } from "@mui/icons-material";
import { Box } from "@mui/material";
import { MOBILE_COLOR_GREY_850, MobileTypography } from "../../components";

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
      <ArrowBackRounded sx={{ fontSize: 36, color: MOBILE_COLOR_GREY_850 }} />
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
      <QuestionMarkRounded
        sx={{ fontSize: 36, color: MOBILE_COLOR_GREY_850 }}
      />
    </Box>
  );
};

export default ServicePreviewTopbar;
