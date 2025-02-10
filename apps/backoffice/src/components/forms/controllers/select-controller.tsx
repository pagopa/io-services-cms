import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectProps,
} from "@mui/material";
import { ReactNode } from "react";
import { Controller, get, useFormContext } from "react-hook-form";

export type SelectControllerProps = {
  helperText?: ReactNode;
  items: {
    label: string;
    value: number | readonly string[] | string | undefined;
  }[];
  name: string;
} & SelectProps;

/** Controller for MUI `Select` component.\
 * Used for collecting user provided information from a list of options. */
export function SelectController({
  helperText,
  items,
  name,
  ...props
}: SelectControllerProps) {
  const { control, formState, register } = useFormContext();
  const error = get(formState.errors, name);

  if (items.length === 0) return; // avoid mui out-of-range error
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <FormControl fullWidth margin="normal">
          <InputLabel
            disabled={props.disabled}
            error={!!error}
            id={`${name}-label`}
            required={props.required}
          >
            {props.label}
          </InputLabel>
          <Select
            {...props}
            {...register(name)}
            MenuProps={{ disableScrollLock: true }}
            error={!!error}
            fullWidth
            id={name}
            input={<OutlinedInput id="select-label" label={props.label} />}
            labelId={`${name}-label`}
            onChange={onChange}
            value={value}
          >
            {items.map((item, index) => (
              <MenuItem key={index} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText error={!!error}>
            {error ? error.message : (helperText ?? null)}
          </FormHelperText>
        </FormControl>
      )}
    />
  );
}
