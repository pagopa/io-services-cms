import { TextFieldController } from "@/components/forms/controllers";
import { zodResolver } from "@hookform/resolvers/zod";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { CircularProgress } from "@mui/material";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";
import { TFunction, useTranslation } from "next-i18next";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

export interface AggregatedInstitutionsDialogProps {
  isDownloadReady?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  sumbitting?: boolean;
}

const defaultFormValues = {
  confirmPassword: "",
  password: "",
};

const getValidationSchema = (t: TFunction) =>
  z
    .object({
      confirmPassword: z
        .string()
        .min(
          1,
          t(
            "routes.aggregated-institutions.exportDialog.fields.errors.emptyConfirmPassword",
          ),
        ),
      password: z
        .string()
        .min(
          1,
          t(
            "routes.aggregated-institutions.exportDialog.fields.errors.emptyPassword",
          ),
        )
        .regex(
          /^(?=[^A-Z]*[A-Z])(?=[^\d]*\d).{12,100}$/,
          t(
            "routes.aggregated-institutions.exportDialog.fields.errors.invalidPassword",
          ),
        ),
    })
    .refine((schema) => schema.password === schema.confirmPassword, {
      message: t(
        "routes.aggregated-institutions.exportDialog.fields.errors.passwordDontMatch",
      ),
      path: ["confirmPassword"],
    });

export const AggregatedInstitutionsDialog = ({
  isDownloadReady,
  isOpen,
  onClose,
  onConfirm,
  sumbitting,
}: AggregatedInstitutionsDialogProps) => {
  const { t } = useTranslation();
  const method = useForm({
    defaultValues: defaultFormValues,
    mode: "onTouched",
    resolver: zodResolver(getValidationSchema(t)),
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleClose = () => {
    method.reset();
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(method.getValues().password);
    handleClose();
  };

  return (
    <Dialog fullWidth onClose={handleClose} open={isOpen}>
      <FormProvider {...method}>
        <form
          onReset={handleClose}
          onSubmit={method.handleSubmit(handleConfirm)}
        >
          <DialogTitle>
            {t("routes.aggregated-institutions.exportDialog.title")}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              {t("routes.aggregated-institutions.exportDialog.description")}
            </Typography>
            <List sx={{ listStyleType: "disc", pl: 4, pt: 2 }}>
              <ListItem disableGutters sx={{ display: "list-item", py: 0 }}>
                <Typography variant="body1">
                  {t(
                    "routes.aggregated-institutions.exportDialog.rules.uppercase",
                  )}
                </Typography>
              </ListItem>
              <ListItem disableGutters sx={{ display: "list-item", py: 0 }}>
                <Typography variant="body1">
                  {t(
                    "routes.aggregated-institutions.exportDialog.rules.number",
                  )}
                </Typography>
              </ListItem>
            </List>
            <TextFieldController
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              fullWidth
              label={t(
                "routes.aggregated-institutions.exportDialog.fields.newPassword",
              )}
              margin="normal"
              name="password"
              type={showNewPassword ? "text" : "password"}
            />
            <TextFieldController
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              fullWidth
              label={t(
                "routes.aggregated-institutions.exportDialog.fields.confirmPassword",
              )}
              margin="normal"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                {t(
                  isDownloadReady
                    ? "routes.aggregated-institutions.exportDialog.info.fileAvailable"
                    : "routes.aggregated-institutions.exportDialog.info.fileNotAvailable",
                )}
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions
            disableSpacing
            sx={{ gap: 2, paddingX: 3, paddingY: 2 }}
          >
            <Button type="reset" variant="outlined">
              {t("buttons.cancel")}
            </Button>
            <LoadingButton
              loading={sumbitting}
              loadingIndicator={
                <CircularProgress size={24} sx={{ color: "white" }} />
              }
              sx={{
                "&.Mui-disabled": {
                  backgroundColor: "primary.main",
                },
              }}
              type="submit"
              variant="contained"
            >
              <span>{t("buttons.confirm")}</span>
            </LoadingButton>
          </DialogActions>
        </form>
      </FormProvider>
    </Dialog>
  );
};
