import DialogProvider from "@/components/dialog-provider";
import { DrawerProvider } from "@/components/drawer-provider";
import { Notification } from "@/components/notification";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@pagopa/mui-italia"; // MUI Italia theme
import { SnackbarProvider } from "notistack";
import { ReactNode } from "react";

declare module "notistack" {
  interface VariantOverrides {
    custom: true;
  }
}

type AppProviderProps = {
  children: ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DialogProvider>
        <DrawerProvider>
          <SnackbarProvider
            Components={{
              custom: Notification
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
