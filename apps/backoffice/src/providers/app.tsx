import DialogProvider from "@/components/dialog-provider";
import { DrawerProvider } from "@/components/drawer-provider";
import { Notification } from "@/components/notification";
import { getConfiguration } from "@/config";
import { appTheme } from "@/config/app-theme";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import mixpanel from "mixpanel-browser";
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

mixpanel.init(getConfiguration().BACK_OFFICE_MIXPANEL_TOKEN, {
  debug: true,
  verbose: true,
  track_pageview: false,
  persistence: "localStorage",
  ignore_dnt: true
});

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <ThemeProvider theme={appTheme}>
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
