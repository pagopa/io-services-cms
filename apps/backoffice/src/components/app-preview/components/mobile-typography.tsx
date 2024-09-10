import { Typography, TypographyProps } from "@mui/material";

type MobileTypographyProps = TypographyProps;

export const MobileTypography = (props: MobileTypographyProps) => (
  <Typography {...props} fontFamily="TitilliumSansPro, sans-serif" />
);
