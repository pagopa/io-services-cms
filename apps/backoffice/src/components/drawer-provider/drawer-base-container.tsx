import { Box, Drawer } from "@mui/material";
import { ReactNode } from "react";
import { IconButtonClose } from "../buttons";

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
    <Drawer
      data-testid="bo-io-drawer-base-container"
      anchor="right"
      open={open}
      onClose={onClose}
      disableScrollLock
    >
      <Box paddingX={2} paddingY={2} textAlign="right">
        <IconButtonClose onClick={onClose} />
      </Box>
      <Box paddingX={3}>{children}</Box>
    </Drawer>
  );
};
