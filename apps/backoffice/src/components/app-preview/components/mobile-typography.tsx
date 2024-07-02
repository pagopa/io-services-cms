import { Typography, TypographyProps } from "@mui/material";
import { styled } from "@mui/system";

interface MobileTypographyProps extends TypographyProps {}

const MobileTypographyRoot = styled(Typography)(({ theme }) => ({
  fontFamily: "TitilliumSansPro, sans-serif"
}));

/** Render IO App font **Readex Pro** */
export const MobileTypography = (props: MobileTypographyProps) => {
  return <MobileTypographyRoot {...props} />;
};
