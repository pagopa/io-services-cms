import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  IconButton,
  InputAdornment,
  TextField,
  TextFieldProps,
} from "@mui/material";
import { useCallback, useState } from "react";
import {
  Controller,
  FieldError,
  FieldValues,
  Path,
  useFormContext,
} from "react-hook-form";

type PasswordTextFieldProps<FormValues extends FieldValues> = {
  label: string;
  // Path<FormValues> ensures the field name is a valid path in the form's type definition
  // This provides compile-time safety against typos (e.g., "password" or "user.password")
  name: Path<FormValues>;
  // Optional callback to customize the helper text when a validation error occurs
  onError?: (error?: FieldError) => TextFieldProps["helperText"];
} & Omit<
  TextFieldProps,
  // These props are managed internally by the component or provided by react-hook-form's Controller
  // They are excluded to prevent conflicting with internal bindings:
  // - "type" is toggled between "password" and "text" via showPassword state
  // - "InputProps" is used for the password visibility toggle icon button
  // - "error", "onBlur", "onChange", "ref", "value" come from the Controller's field binding
  // - "onError" is excluded because TextFieldProps inherits the HTML media-error event handler
  //   (onError?: ReactEventHandler<HTMLDivElement>) from React.HTMLAttributes, which would
  //   conflict with the custom onError prop defined above
  | "InputProps"
  | "error"
  | "label"
  | "name"
  | "onBlur"
  | "onChange"
  | "onError"
  | "ref"
  | "type"
  | "value"
>;

export function PasswordTextField<FormValues extends FieldValues>({
  label,
  name,
  onError,
  ...props
}: PasswordTextFieldProps<FormValues>) {
  const { control } = useFormContext<FormValues>();
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        const maybeHelperText = onError ? onError(error) : error?.message;

        return (
          <TextField
            InputLabelProps={{
              shrink: true,
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton edge="end" onClick={toggleShowPassword}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            error={!!error}
            fullWidth
            helperText={maybeHelperText}
            label={label}
            margin="normal"
            type={showPassword ? "text" : "password"}
            {...field}
            {...props}
          />
        );
      }}
    />
  );
}
