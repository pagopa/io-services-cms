import DialogProvider from "@/components/dialog-provider";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { theme } from "@pagopa/mui-italia"; // MUI Italia theme
import { ReactNode } from "react";

type AppProviderProps = {
  children: ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DialogProvider>{children}</DialogProvider>
    </ThemeProvider>
  );
};
