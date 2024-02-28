import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import { ReactNode } from "react";

export type DrawerBaseContentHeader = {
  startIcon?: ReactNode;
  title: string;
};

export type DrawerBaseContentProps = {
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  header: DrawerBaseContentHeader;
  children: ReactNode;
};

/** Render MUI Drawer basic content, with custom width, header and body _(as children)_ */
export const DrawerBaseContent = ({
  width,
  minWidth,
  maxWidth,
  header,
  children
}: DrawerBaseContentProps) => {
  const { t } = useTranslation();

  return (
    <Box width={width} minWidth={minWidth} maxWidth={maxWidth} marginBottom={5}>
      <Stack direction="row" spacing={1}>
        {header.startIcon}
        <Typography variant="h6">{t(header.title)}</Typography>
      </Stack>
      {children}
    </Box>
  );
};
