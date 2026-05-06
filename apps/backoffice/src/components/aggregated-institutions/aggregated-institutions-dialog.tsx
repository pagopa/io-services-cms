import { PasswordTextField } from "@/components/forms/controllers/password-field-controller";
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
import { LoadingButton } from "@mui/lab";
import { CircularProgress } from "@mui/material";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";
import { Box } from "@mui/system";
import { TFunction, useTranslation } from "next-i18next";
import { useCallback, useEffect } from "react";
import {
  FieldError,
  FormProvider,
  SubmitErrorHandler,
  useForm,
} from "react-hook-form";
import { z } from "zod";

const PasswordErrorCode = {
  PASSWORD_MISSING: "password_missing", // NOSONAR
  PASSWORD_NOT_COMPLIANT: "password_not_compliant", // NOSONAR
} as const satisfies Record<string, InvalidFormReason>;

const ConfirmPasswordErrorCode = {
  CONFIRM_PASSWORD_MISSING: "confirm_password_missing", // NOSONAR
  PASSWORD_MISMATCH: "password_mismatch", // NOSONAR
} as const satisfies Record<string, InvalidFormReason>;

const passwordErrorCodeSchema = z.enum(PasswordErrorCode);
const confirmPasswordErrorCodeSchema = z.enum(ConfirmPasswordErrorCode);
const invalidFormReasonSchema = z.union([
  passwordErrorCodeSchema,
  confirmPasswordErrorCodeSchema,
]);

const getErrorCodeToMessage = (
  t: TFunction,
): Record<InvalidFormReason, string> => ({
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

      const passwordResult = passwordErrorCodeSchema.safeParse(
        password?.message,
      );
      const confirmPasswordResult = confirmPasswordErrorCodeSchema.safeParse(
        confirmPassword?.message,
      );

      if (passwordResult.success) {
        reasons.add(passwordResult.data);
      }

      if (confirmPasswordResult.success) {
        reasons.add(confirmPasswordResult.data);
      }

      if (reasons.size > 0) {
        trackEaFileGenerateInvalidFormEvent(passwordStatus, reasons);
      }
    },
    [passwordStatus],
  );

  const handleOnError = useCallback(
    (error?: FieldError) => {
      const errorCodeToMessage = getErrorCodeToMessage(t);

      const maybeErrorCode = invalidFormReasonSchema.safeParse(error?.message);

      if (maybeErrorCode.success) {
        return errorCodeToMessage[maybeErrorCode.data];
      }

      return error?.message;
    },
    [t],
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
            <PasswordTextField<FormValues>
              label={t(
                "routes.aggregated-institutions.exportDialog.fields.newPassword",
              )}
              name="password"
              onError={handleOnError}
            />
            <PasswordTextField<FormValues>
              label={t(
                "routes.aggregated-institutions.exportDialog.fields.confirmPassword",
              )}
              name="confirmPassword"
              onError={handleOnError}
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
