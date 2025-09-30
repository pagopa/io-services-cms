import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import { ReactNode } from "react";

import { MarkdownView } from "../markdown-view";

export interface FormStepSectionWrapperProps {
  children: ReactNode;
  description?: string;
  icon?: ReactNode;
  title?: string;
}

/** Purely layout component to wrap the contents of the form section within a well-defined graphic scheme */
export const FormStepSectionWrapper = ({
  children,
  description,
  icon,
  title,
}: FormStepSectionWrapperProps) => {
  useTranslation();

  return (
    <Box
      border={1}
      borderColor="#E3E7EB"
      borderRadius={2}
      marginY={3}
      padding={3}
    >
      {title && (
        <Stack
          alignItems="center"
          direction="row"
          gap={1}
          marginBottom={description ? 0 : 2}
        >
          {icon}
          <Typography variant="sidenav">{title}</Typography>
        </Stack>
      )}
      {description && (
        <Typography
          color="text.secondary"
          component="div"
          marginBottom={2}
          variant="body2"
        >
          <MarkdownView>{description}</MarkdownView>
        </Typography>
      )}
      {children}
    </Box>
  );
};
