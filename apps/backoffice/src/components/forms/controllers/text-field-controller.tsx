import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { InputAdornment, TextField, TextFieldProps } from "@mui/material";
import { Controller, get, useFormContext } from "react-hook-form";

export type TextFieldControllerProps = {
  name: string;
} & TextFieldProps;

/** Controller for MUI `TextField` component.\
 * Text Fields let users enter and edit text. */
export function TextFieldController({
  name,
  ...props
}: TextFieldControllerProps) {
  const { control, formState, register } = useFormContext();
  const error = get(formState.errors, name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
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
          helperText={error ? error.message : (props.helperText ?? null)}
          margin={props.margin ?? "normal"}
          onChange={onChange}
          value={value}
        />
      )}
    />
  );
}
