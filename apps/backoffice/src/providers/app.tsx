import DialogProvider from "@/components/dialog-provider";
import { DrawerProvider } from "@/components/drawer-provider";
import { Notification } from "@/components/notification";
import { appTheme } from "@/config/app-theme";
import { mixpanelSetup } from "@/utils/mix-panel";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
import { ReactNode } from "react";

declare module "notistack" {
  interface VariantOverrides {
    custom: true;
  }
}

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  mixpanelSetup();

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <DialogProvider>
        <DrawerProvider>
          <SnackbarProvider
            Components={{
              custom: Notification,
            }}
            maxSnack={5}
          >
            {children}
          </SnackbarProvider>
        </DrawerProvider>
      </DialogProvider>
    </ThemeProvider>
  );
};
