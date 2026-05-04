import { AggregatedInstitutionsManageKeysPassword } from "@/generated/api/AggregatedInstitutionsManageKeysPassword";
import {
  GeneratePasswordStatus,
  InvalidFormReason,
  trackEaFileGenerateInvalidFormEvent,
  trackEaFileGeneratePasswordCloseEvent,
  trackEaFileGeneratePasswordConfirmEvent,
  trackEaFileGeneratePasswordEvent,
} from "@/utils/mix-panel";
import { zodResolver } from "@hookform/resolvers/zod";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { CircularProgress, TextField } from "@mui/material";
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
import { Box } from "@mui/system";
import { TFunction, useTranslation } from "next-i18next";
import { useCallback, useEffect, useState } from "react";
import {
  Controller,
  FormProvider,
  Path,
  SubmitErrorHandler,
  useForm,
  useFormContext,
} from "react-hook-form";
import { z } from "zod";

const getLocalizedErrorMessages = (t: TFunction) => ({
  emptyConfirmPassword: t(
    "routes.aggregated-institutions.exportDialog.fields.errors.emptyConfirmPassword",
  ),
  emptyPassword: t(
    "routes.aggregated-institutions.exportDialog.fields.errors.emptyPassword",
  ),
  invalidPassword: t(
    "routes.aggregated-institutions.exportDialog.fields.errors.invalidPassword",
  ),
  passwordDontMatch: t(
    "routes.aggregated-institutions.exportDialog.fields.errors.passwordDontMatch",
  ),
});

export interface AggregatedInstitutionsDialogProps {
  isDownloadReady?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: AggregatedInstitutionsManageKeysPassword) => void;
  submitting?: boolean;
}

const defaultFormValues = {
  confirmPassword: "",
  password: "" as AggregatedInstitutionsManageKeysPassword,
};

type FormValues = typeof defaultFormValues;

interface PasswordTextFieldProps {
  label: string;
  name: Path<FormValues>;
}

const PasswordTextField = ({ label, name }: PasswordTextFieldProps) => {
  const { control } = useFormContext<FormValues>();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          InputLabelProps={{
            shrink: true,
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          error={!!error}
          fullWidth
          helperText={error?.message}
          label={label}
          margin="normal"
          type={showPassword ? "text" : "password"}
        />
      )}
    />
  );
};

const getValidationSchema = (t: TFunction) => {
  const errorMessages = getLocalizedErrorMessages(t);

  return z
    .object({
      confirmPassword: z.string().min(1, errorMessages.emptyConfirmPassword),
      password: z
        .string()
        .min(1, errorMessages.emptyPassword)
        .refine(
          (password) => AggregatedInstitutionsManageKeysPassword.is(password),
          errorMessages.invalidPassword,
        ),
    })
    .refine((schema) => schema.password === schema.confirmPassword, {
      message: errorMessages.passwordDontMatch,
      path: ["confirmPassword"],
    });
};

export const AggregatedInstitutionsDialog = ({
  isDownloadReady,
  isOpen,
  onClose,
  onConfirm,
  submitting,
}: AggregatedInstitutionsDialogProps) => {
  const passwordStatus: GeneratePasswordStatus = isDownloadReady // NOSONAR
    ? "replacement"
    : "new_password";
  const { t } = useTranslation();
  const methods = useForm({
    defaultValues: defaultFormValues,
    mode: "onTouched",
    resolver: zodResolver(getValidationSchema(t)),
  });

  useEffect(() => {
    if (isOpen) {
      trackEaFileGeneratePasswordEvent(passwordStatus);
    }
  }, [isOpen, passwordStatus]);

  const resetAndClose = useCallback(() => {
    methods.reset(defaultFormValues);
    onClose();
  }, [methods, onClose]);

  const handleClose = useCallback(() => {
    trackEaFileGeneratePasswordCloseEvent(passwordStatus);
    resetAndClose();
  }, [passwordStatus, resetAndClose]);

  const handleConfirm = () => {
    const password = methods.getValues("password");
    trackEaFileGeneratePasswordConfirmEvent(passwordStatus);
    onConfirm(password as AggregatedInstitutionsManageKeysPassword);
    resetAndClose();
  };

  const handleSubmitError = useCallback<
    SubmitErrorHandler<{
      confirmPassword: string;
      password: string;
    }>
  >(
    (errors) => {
      const errorMessages = getLocalizedErrorMessages(t);
      const reasons = new Set<InvalidFormReason>();

      if (errors?.password?.message === errorMessages.emptyPassword) {
        reasons.add("password_missing");
      }
      if (
        errors?.confirmPassword?.message === errorMessages.emptyConfirmPassword
      ) {
        reasons.add("confirm_password_missing");
      }
      if (errors?.password?.message === errorMessages.invalidPassword) {
        reasons.add("password_not_compliant");
      }
      if (
        errors?.confirmPassword?.message === errorMessages.passwordDontMatch
      ) {
        reasons.add("password_mismatch");
      }

      if (reasons.size > 0) {
        trackEaFileGenerateInvalidFormEvent(passwordStatus, reasons);
      }
    },
    [t, passwordStatus],
  );

  return (
    <Dialog fullWidth onClose={handleClose} open={isOpen}>
      <FormProvider {...methods}>
        <Box
          component="form"
          onSubmit={methods.handleSubmit(handleConfirm, handleSubmitError)}
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
            <PasswordTextField
              label={t(
                "routes.aggregated-institutions.exportDialog.fields.newPassword",
              )}
              name="password"
            />
            <PasswordTextField
              label={t(
                "routes.aggregated-institutions.exportDialog.fields.confirmPassword",
              )}
              name="confirmPassword"
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
            <Button onClick={handleClose} type="button" variant="outlined">
              {t("buttons.cancel")}
            </Button>
            <LoadingButton
              loading={submitting}
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
        </Box>
      </FormProvider>
    </Dialog>
  );
};
