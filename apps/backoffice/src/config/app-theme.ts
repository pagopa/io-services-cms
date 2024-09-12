import { createTheme } from "@mui/material/styles";
import { theme } from "@pagopa/mui-italia";

/** App custom theme
 *
 * Based on `mui-italia` theme with some minor customizations. */
export const appTheme = createTheme({
  ...theme,
  components: {
    ...theme.components,
    MuiChip: {
      ...theme.components?.MuiChip,
      styleOverrides: {
        ...theme.components?.MuiChip?.styleOverrides,
        colorError: {
          backgroundColor: "#FFE0E0",
          color: "#761F1F",
        },
        colorSuccess: {
          backgroundColor: "#E1F4E1",
          color: "#224021",
        },
        colorWarning: {
          backgroundColor: "#FFF5DA",
          color: "#614C15",
        },
      },
    },
  },
});
