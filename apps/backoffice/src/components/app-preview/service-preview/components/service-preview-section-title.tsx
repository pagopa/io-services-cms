import { Box } from "@mui/system";
import { MOBILE_COLOR_GREY_700, MobileTypography } from "../../components";

type SectionTitleProps = {
  text: string;
};

const ServicePreviewSectionTitle = ({ text }: SectionTitleProps) => {
  return (
    <Box paddingX={3} paddingY={1.5}>
      <MobileTypography
        color={MOBILE_COLOR_GREY_700}
        fontSize={16}
        fontWeight={400}
        lineHeight="24px"
      >
        {text}
      </MobileTypography>
    </Box>
  );
};

export default ServicePreviewSectionTitle;
