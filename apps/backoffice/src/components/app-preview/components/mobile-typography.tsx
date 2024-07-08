import { Typography, TypographyProps } from "@mui/material";

interface MobileTypographyProps extends TypographyProps {}

export const MobileTypography = (props: MobileTypographyProps) => {
  return <Typography {...props} fontFamily="TitilliumSansPro, sans-serif" />;
};
