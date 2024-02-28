import React, { ReactNode, createContext, useContext, useState } from "react";
import { DrawerBaseContainer } from ".";

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
      <DrawerBaseContainer open={isDrawerOpen} onClose={closeDrawer}>
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
