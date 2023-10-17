import { Close } from "@mui/icons-material";
import { Box, Drawer, IconButton } from "@mui/material";
import React, { ReactNode, createContext, useContext, useState } from "react";

interface DrawerOptions {
  isDrawerOpen: boolean;
  openDrawer: (content: ReactNode) => void;
  closeDrawer: () => void;
}

const DrawerContext = createContext<DrawerOptions | undefined>(undefined);

export const DrawerProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState<ReactNode | null>(null);

  const openDrawer = (content: React.ReactNode) => {
    setDrawerContent(content);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setDrawerContent(null);
  };

  return (
    <DrawerContext.Provider
      value={{
        isDrawerOpen,
        openDrawer,
        closeDrawer
      }}
    >
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={closeDrawer}
        disableScrollLock
      >
        <Box paddingX={2} paddingY={2} textAlign="right">
          <IconButton aria-label="close-drawer" onClick={closeDrawer}>
            <Close />
          </IconButton>
        </Box>
        <Box paddingX={3}>{drawerContent}</Box>
      </Drawer>
      {children}
    </DrawerContext.Provider>
  );
};

export const useDrawer = () => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error("UseDrawer must be used inside DrawerProvider.");
  }
  return context;
};
