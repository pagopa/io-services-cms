import { Close } from "@mui/icons-material";
import { Box, Drawer, IconButton } from "@mui/material";
import { ReactNode } from "react";

export type DrawerBaseContainerProps = {
  open: boolean;
  children: ReactNode;
  onClose: () => void;
};

/** Render MUI Drawer basic container box, with custom close button and content padding */
export const DrawerBaseContainer = ({
  open,
  children,
  onClose
}: DrawerBaseContainerProps) => {
  return (
    <Drawer anchor="right" open={open} onClose={onClose} disableScrollLock>
      <Box paddingX={2} paddingY={2} textAlign="right">
        <IconButton aria-label="close-drawer" onClick={onClose}>
          <Close />
        </IconButton>
      </Box>
      <Box paddingX={3}>{children}</Box>
    </Drawer>
  );
};
