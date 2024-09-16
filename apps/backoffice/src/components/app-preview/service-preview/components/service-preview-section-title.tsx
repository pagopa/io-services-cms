import { Box } from "@mui/system";

import { IOColors, MobileTypography } from "../../components";

interface SectionTitleProps {
  text: string;
}

const ServicePreviewSectionTitle = ({ text }: SectionTitleProps) => (
  <Box paddingX={3} paddingY={1.5}>
    <MobileTypography
      color={IOColors["grey-700"]}
      fontSize={16}
      fontWeight={600}
      lineHeight="24px"
    >
      {text}
    </MobileTypography>
  </Box>
);

export default ServicePreviewSectionTitle;
