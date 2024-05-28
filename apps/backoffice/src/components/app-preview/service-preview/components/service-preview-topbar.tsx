import { ArrowBackRounded, QuestionMarkRounded } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { MOBILE_COLOR_GREY_850 } from "../../components";

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
    >
      <ArrowBackRounded sx={{ fontSize: 36, color: MOBILE_COLOR_GREY_850 }} />
      <Typography
        noWrap
        sx={{
          fontSize: "22px",
          fontWeight: 400,
          lineHeight: "33px",
          opacity: opacity,
          textOverflow: "ellipsis"
        }}
      >
        {serviceName}
      </Typography>
      <QuestionMarkRounded
        sx={{ fontSize: 36, color: MOBILE_COLOR_GREY_850 }}
      />
    </Box>
  );
};

export default ServicePreviewTopbar;
