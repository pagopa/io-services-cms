import { Typography, TypographyProps } from "@mui/material";

type MobileTypographyProps = TypographyProps;

/**
 * TODO
 * Render IO App mobile font **Readex Pro**
 * @param props
 * @returns
 */
export const MobileTypography = (props: MobileTypographyProps) => {
  return <Typography {...props}>{props.children}</Typography>;
};
