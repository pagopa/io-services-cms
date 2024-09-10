import { OpenInNew } from "@mui/icons-material";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { Grid, InputAdornment, TextField, TextFieldProps } from "@mui/material";
import { ButtonNaked } from "@pagopa/mui-italia";
import { useTranslation } from "next-i18next";
import { Controller, get, useFormContext } from "react-hook-form";

export type UrlFieldControllerProps = {
  name: string;
} & TextFieldProps;

/** Controller for MUI `TextField` component enhanced with url type check and a "Try URL" action button. */
export function UrlFieldController({
  name,
  ...props
}: UrlFieldControllerProps) {
  const { t } = useTranslation();
  const { control, formState, register } = useFormContext();
  const error = get(formState.errors, name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <Grid
          alignItems="center"
          columnSpacing={2}
          container
          direction="row"
          justifyContent="center"
        >
          <Grid item xs={true}>
            <TextField
              {...register(name)}
              {...props}
              InputProps={{
                endAdornment: error ? (
                  <InputAdornment position="end">
                    <ErrorOutlineRoundedIcon color="error" />
                  </InputAdornment>
                ) : undefined,
              }}
              error={!!error}
              fullWidth
              helperText={error ? error.message : null}
              margin="normal"
              onChange={onChange}
              value={value}
            />
          </Grid>
          <Grid item xs="auto">
            <ButtonNaked
              color="primary"
              disabled={value ? (value.length === 0 ?? false) : true}
              onClick={() => window.open(value, "_blank")}
              onFocusVisible={function noRefCheck() {}}
              size="large"
              startIcon={<OpenInNew />}
            >
              {t("forms.testUrl")}
            </ButtonNaked>
          </Grid>
        </Grid>
      )}
    />
  );
}
