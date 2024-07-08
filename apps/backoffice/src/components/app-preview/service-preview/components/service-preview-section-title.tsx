import { Box } from "@mui/system";
import { IOColors, MobileTypography } from "../../components";

type SectionTitleProps = {
  text: string;
};

const ServicePreviewSectionTitle = ({ text }: SectionTitleProps) => {
  return (
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
};

export default ServicePreviewSectionTitle;
