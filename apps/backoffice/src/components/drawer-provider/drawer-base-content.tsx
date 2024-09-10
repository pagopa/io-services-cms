import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import { ReactNode } from "react";

export interface DrawerBaseContentHeader {
  startIcon?: ReactNode;
  title: string;
}

export interface DrawerBaseContentProps {
  children: ReactNode;
  header: DrawerBaseContentHeader;
  maxWidth?: number | string;
  minWidth?: number | string;
  width?: number | string;
}

/** Render MUI Drawer basic content, with custom width, header and body _(as children)_ */
export const DrawerBaseContent = ({
  children,
  header,
  maxWidth,
  minWidth,
  width,
}: DrawerBaseContentProps) => {
  const { t } = useTranslation();

  return (
    <Box
      data-testid="bo-io-drawer-base-content"
      marginBottom={5}
      maxWidth={maxWidth}
      minWidth={minWidth}
      width={width}
    >
      <Stack direction="row" spacing={1}>
        {header.startIcon}
        <Typography variant="h6">{t(header.title)}</Typography>
      </Stack>
      {children}
    </Box>
  );
};
