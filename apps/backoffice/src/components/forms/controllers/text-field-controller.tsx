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
  const { register, control, formState } = useFormContext();
  const error = get(formState.errors, name);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => (
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
          helperText={error ? error.message : props.helperText ?? null}
          onChange={onChange}
        />
      )}
    />
  );
}
