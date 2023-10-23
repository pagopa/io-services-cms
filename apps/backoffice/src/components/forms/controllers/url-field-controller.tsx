import CallMadeIcon from "@mui/icons-material/CallMade";
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
  const { register, control, formState } = useFormContext();
  const error = get(formState.errors, name);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => (
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="center"
          columnSpacing={2}
        >
          <Grid item xs={true}>
            <TextField
              {...register(name)}
              {...props}
              fullWidth
              margin="normal"
              value={value}
              InputProps={{
                endAdornment: error ? (
                  <InputAdornment position="end">
                    <ErrorOutlineRoundedIcon color="error" />
                  </InputAdornment>
                ) : (
                  undefined
                )
              }}
              error={!!error}
              helperText={error ? error.message : null}
              onChange={onChange}
            />
          </Grid>
          <Grid item xs="auto">
            <ButtonNaked
              color="text"
              endIcon={<CallMadeIcon />}
              onFocusVisible={function noRefCheck() {}}
              size="large"
              disabled={value ? value.length === 0 ?? false : true}
              onClick={() => window.open(value, "_blank")}
            >
              {t("forms.testUrl")}
            </ButtonNaked>
          </Grid>
        </Grid>
      )}
    />
  );
}
