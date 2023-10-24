import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import { ReactNode } from "react";

export type FormStepSectionWrapperProps = {
  title: string;
  icon: ReactNode;
  children: ReactNode;
};

/** Purely layout component to wrap the contents of the form section within a well-defined graphic scheme */
export const FormStepSectionWrapper = ({
  title,
  icon,
  children
}: FormStepSectionWrapperProps) => {
  const { t } = useTranslation();

  return (
    <Box
      border={1}
      borderColor="#E3E7EB"
      borderRadius={2}
      padding={3}
      marginY={3}
    >
      <Stack direction="row" alignItems="center" gap={1} marginBottom={2}>
        {icon}
        <Typography variant="sidenav">{title}</Typography>
      </Stack>
      {children}
    </Box>
  );
};
