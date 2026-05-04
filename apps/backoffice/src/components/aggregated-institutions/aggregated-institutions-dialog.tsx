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
import { useTranslation } from "next-i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Controller,
  FormProvider,
  Path,
  SubmitErrorHandler,
  useForm,
  useFormContext,
} from "react-hook-form";
import { z } from "zod";

const PasswordErrorCode = {
  PASSWORD_MISSING: "password_missing",
  PASSWORD_NOT_COMPLIANT: "password_not_compliant",
} as const satisfies Record<string, InvalidFormReason>;

const ConfirmPasswordErrorCode = {
  CONFIRM_PASSWORD_MISSING: "confirm_password_missing",
  PASSWORD_MISMATCH: "password_mismatch",
} as const satisfies Record<string, InvalidFormReason>;

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
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  const errorCodeToMessage: Record<InvalidFormReason, string> = useMemo(
    () => ({
      [ConfirmPasswordErrorCode.CONFIRM_PASSWORD_MISSING]: t(
        "routes.aggregated-institutions.exportDialog.fields.errors.emptyConfirmPassword",
      ),
      [ConfirmPasswordErrorCode.PASSWORD_MISMATCH]: t(
        "routes.aggregated-institutions.exportDialog.fields.errors.passwordDontMatch",
      ),
      [PasswordErrorCode.PASSWORD_MISSING]: t(
        "routes.aggregated-institutions.exportDialog.fields.errors.emptyPassword",
      ),
      [PasswordErrorCode.PASSWORD_NOT_COMPLIANT]: t(
        "routes.aggregated-institutions.exportDialog.fields.errors.invalidPassword",
      ),
    }),
    [t],
  );

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
          helperText={
            error?.message && error.message in errorCodeToMessage
              ? errorCodeToMessage[error.message as InvalidFormReason]
              : null
          }
          label={label}
          margin="normal"
          type={showPassword ? "text" : "password"}
        />
      )}
    />
  );
};

const validationSchema = z
  .object({
    confirmPassword: z
      .string()
      .min(1, ConfirmPasswordErrorCode.CONFIRM_PASSWORD_MISSING),
    password: z
      .string()
      .min(1, PasswordErrorCode.PASSWORD_MISSING)
      .refine(
        (password) => AggregatedInstitutionsManageKeysPassword.is(password),
        PasswordErrorCode.PASSWORD_NOT_COMPLIANT,
      ),
  })
  .refine((schema) => schema.password === schema.confirmPassword, {
    message: ConfirmPasswordErrorCode.PASSWORD_MISMATCH,
    path: ["confirmPassword"],
  });

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
    resolver: zodResolver(validationSchema),
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
    ({ confirmPassword, password }) => {
      const reasons = new Set<InvalidFormReason>();

      const maybeConfirmPasswordError = Object.values(
        ConfirmPasswordErrorCode,
      ).find((code) => code === confirmPassword?.message);

      const maybePasswordError = Object.values(PasswordErrorCode).find(
        (code) => code === password?.message,
      );

      if (maybePasswordError) {
        reasons.add(maybePasswordError);
      }

      if (maybeConfirmPasswordError) {
        reasons.add(maybeConfirmPasswordError);
      }

      if (reasons.size > 0) {
        trackEaFileGenerateInvalidFormEvent(passwordStatus, reasons);
      }
    },
    [passwordStatus],
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
