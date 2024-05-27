import { ArrowBackRounded, QuestionMarkRounded } from "@mui/icons-material";
import { Box } from "@mui/material";
import { MOBILE_COLOR_GREY_850 } from "../../components";

/** Display App IO top navigation bar */
const ServicePreviewTopbar = () => {
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
      <QuestionMarkRounded
        sx={{ fontSize: 36, color: MOBILE_COLOR_GREY_850 }}
      />
    </Box>
  );
};

export default ServicePreviewTopbar;
