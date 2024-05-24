import { Box } from "@mui/system";
import { MobileTypography } from "../../components";

type SectionTitleProps = {
  text: string;
};

const ServicePreviewSectionTitle = ({ text }: SectionTitleProps) => {
  return (
    <Box paddingX={3} paddingY={1.5}>
      <MobileTypography
        color="#555C70"
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
