import { Alert, AlertColor, Box, Typography } from "@mui/material";
import { CustomContentProps, SnackbarContent, useSnackbar } from "notistack";
import { forwardRef, useCallback } from "react";

export interface NotificationProps extends CustomContentProps {
  /** Alert body message content */
  message?: string;
  /** The severity of the alert. This defines the color and icon used.  */
  severity: AlertColor;
  /** Alert title */
  title?: string;
}

/** Custom `notistack` notification content */
export const Notification = forwardRef<HTMLDivElement, NotificationProps>(
  ({ id, ...props }, ref) => {
    const { closeSnackbar } = useSnackbar();

    const handleDismiss = useCallback(() => {
      closeSnackbar(id);
    }, [id, closeSnackbar]);

    return (
      <SnackbarContent ref={ref}>
        <Alert
          data-testid="bo-io-notification"
          onClose={handleDismiss}
          severity={props.severity}
          sx={{ width: "100%" }}
          variant="outlined"
        >
          <Box width="400px">
            {props.title ? (
              <Typography
                data-testid="bo-io-notification-title"
                fontWeight={600}
                variant="body2"
              >
                {props.title}
              </Typography>
            ) : null}
            <Typography variant="body2">{props.message}</Typography>
          </Box>
        </Alert>
      </SnackbarContent>
    );
  },
);

Notification.displayName = "Notification";

/** Build snackbar object to enqueue with `enqueueSnackbar` of **notistack** */
export const buildSnackbarItem = (data: {
  message: string;
  severity: string;
  title: string;
}) =>
  ({
    anchorOrigin: {
      horizontal: "right",
      vertical: "top",
    },
    message: data.message,
    severity: data.severity,
    title: data.title,
    variant: "custom",
  }) as any;
