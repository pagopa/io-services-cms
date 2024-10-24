import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import { ReactNode } from "react";

export interface FormStepSectionWrapperProps {
  border?: boolean;
  children: ReactNode;
  icon?: ReactNode;
  title: string;
}

/** Purely layout component to wrap the contents of the form section within a well-defined graphic scheme */
export const FormStepSectionWrapper = ({
  border = true,
  children,
  icon,
  title,
}: FormStepSectionWrapperProps) => {
  useTranslation();

  const boxStyle = () =>
    border
      ? {
          border: 1,
          borderColor: "#E3E7EB",
          borderRadius: 2,
          marginY: 3,
          padding: 3,
        }
      : {};

  return (
    <Box sx={boxStyle}>
      <Stack alignItems="center" direction="row" gap={1} marginBottom={2}>
        {icon}
        <Typography variant="sidenav">{title}</Typography>
      </Stack>
      {children}
    </Box>
  );
};
