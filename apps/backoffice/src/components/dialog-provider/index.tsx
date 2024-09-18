import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { ReactNode, createContext, useContext, useState } from "react";

interface DialogOptions {
  /** label for cancel button: if specified, overwrite default value */
  cancelButtonLabel?: string;
  /** label for confirm button: if specified, overwrite default value */
  confirmButtonLabel?: string;
  /** dialog body message */
  message?: string;
  /** dialog title */
  title: string;
}

interface PromiseInfo {
  reject: (reason?: any) => void;
  resolve: (value: PromiseLike<boolean> | boolean) => void;
}

type ShowDialogHandler = (options: DialogOptions) => Promise<boolean>;

// Create the context so we can use it in our App
const DialogContext = createContext<ShowDialogHandler>(() => {
  throw new Error("Component is not wrapped with a DialogProvider.");
});

const DialogProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions>({ title: "" });
  const [promiseInfo, setPromiseInfo] = useState<PromiseInfo>();

  const showDialog: ShowDialogHandler = (options) =>
    // When the dialog is shown, keep the promise info so we can resolve later
    new Promise<boolean>((resolve, reject) => {
      setPromiseInfo({ reject, resolve });
      setOptions(options);
      setOpen(true);
    });
  const handleConfirm = () => {
    // if the Confirm button gets clicked, resolve with `true`
    setOpen(false);
    promiseInfo?.resolve(true);
    setPromiseInfo(undefined);
  };

  const handleCancel = () => {
    // if the dialog gets canceled, resolve with `false`
    setOpen(false);
    promiseInfo?.resolve(false);
    setPromiseInfo(undefined);
  };

  return (
    <>
      <Dialog
        data-testid="bo-io-dialog-provider"
        disableScrollLock
        onClose={handleCancel}
        open={open}
      >
        <DialogTitle>{options.title}</DialogTitle>
        <DialogContent sx={{ minWidth: "600px" }}>
          <Typography
            dangerouslySetInnerHTML={{
              __html: options.message ?? "",
            }}
          ></Typography>
        </DialogContent>
        <DialogActions sx={{ padding: "16px 24px" }}>
          <Button
            data-testid="bo-io-dialog-provider-cancel-button"
            onClick={handleCancel}
            variant="outlined"
          >
            {options.cancelButtonLabel
              ? t(options.cancelButtonLabel)
              : t("buttons.cancel")}
          </Button>
          <Button
            data-testid="bo-io-dialog-provider-confirm-button"
            onClick={handleConfirm}
            variant="contained"
          >
            {options.confirmButtonLabel
              ? t(options.confirmButtonLabel)
              : t("buttons.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
      <DialogContext.Provider value={showDialog}>
        {children}
      </DialogContext.Provider>
    </>
  );
};

// By calling `useDialog()` in a component we will be able to use the `showDialog()` function
export const useDialog = () => useContext(DialogContext);

export default DialogProvider;
