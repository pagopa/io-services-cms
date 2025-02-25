import { LoaderSkeleton } from "@/components/loaders";
import { Clear } from "@mui/icons-material";
import {
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectProps,
} from "@mui/material";
import { ReactNode } from "react";
import { Controller, get, useFormContext } from "react-hook-form";

export type SelectControllerProps = {
  clearable?: boolean;
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
  clearable,
  helperText,
  items,
  name,
  ...props
}: SelectControllerProps) {
  const { control, formState, register, setValue } = useFormContext();
  const error = get(formState.errors, name);

  // avoid mui out-of-range error
  if (items.length === 0)
    return (
      <LoaderSkeleton loading style={{ height: 87, width: "100%" }}>
        <></>
      </LoaderSkeleton>
    );

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
            endAdornment={
              clearable &&
              value && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setValue(name, "")}
                    size="small"
                    sx={{ marginRight: 2 }}
                  >
                    <Clear />
                  </IconButton>
                </InputAdornment>
              )
            }
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
