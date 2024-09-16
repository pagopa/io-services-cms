import { Box, Drawer } from "@mui/material";
import { ReactNode } from "react";

import { IconButtonClose } from "../buttons";

export interface DrawerBaseContainerProps {
  children: ReactNode;
  onClose: () => void;
  open: boolean;
}

/** Render MUI Drawer basic container box, with custom close button and content padding */
export const DrawerBaseContainer = ({
  children,
  onClose,
  open,
}: DrawerBaseContainerProps) => (
  <Drawer
    anchor="right"
    data-testid="bo-io-drawer-base-container"
    disableScrollLock
    onClose={onClose}
    open={open}
  >
    <Box paddingX={2} paddingY={2} textAlign="right">
      <IconButtonClose onClick={onClose} />
    </Box>
    <Box paddingX={3}>{children}</Box>
  </Drawer>
);
