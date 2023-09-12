import { AlertColor, Box } from "@mui/material";
import { Alert, Snackbar, Typography } from "@mui/material";
import { createContext, useContext, useState } from "react";

type SnackbarOptions = (item: SnackbarItem) => void;

type SnackbarItem = {
  /** The severity of the alert. This defines the color and icon used.  */
  severity: AlertColor;
  /** Alert title */
  title?: string;
  /** Alert body message content */
  message?: string;
};

const SnackbarContext = createContext<SnackbarOptions>(() => {
  console.error("Component is not wrapped with a SnackbarProvider.");
});

const SnackbarProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [alert, setAlert] = useState<SnackbarItem>({
    severity: "success",
    title: "",
    message: ""
  });

  const handleClose = (
    _event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  /** Used to show a snackbar notification content */
  const showSnackbar: SnackbarOptions = ({ severity, title, message }) => {
    setAlert({ severity, title: title ?? "", message: message ?? "" });
    setOpen(true);
  };

  return (
    <>
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right"
        }}
        sx={{ marginTop: "31px", minWidth: "400px" }}
      >
        <Alert
          onClose={handleClose}
          severity={alert.severity}
          sx={{ width: "100%" }}
        >
          <Box width="400px">
            {alert.title ? (
              <Typography variant="body2" fontWeight={600}>
                {alert.title}
              </Typography>
            ) : null}
            <Typography variant="body2">{alert.message}</Typography>
          </Box>
        </Alert>
      </Snackbar>
      <SnackbarContext.Provider value={showSnackbar}>
        {children}
      </SnackbarContext.Provider>
    </>
  );
};

export const useSnackbar = () => {
  return useContext(SnackbarContext);
};

export default SnackbarProvider;
