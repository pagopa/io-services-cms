import React, { ReactNode, createContext, useContext, useState } from "react";

import { DrawerBaseContainer } from ".";

interface DrawerOptions {
  closeDrawer: () => void;
  isDrawerOpen: boolean;
  openDrawer: (content: ReactNode) => void;
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
      data-testid="bo-io-drawer-provider"
      value={{
        closeDrawer,
        isDrawerOpen,
        openDrawer,
      }}
    >
      <DrawerBaseContainer onClose={closeDrawer} open={isDrawerOpen}>
        {drawerContent}
      </DrawerBaseContainer>
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
