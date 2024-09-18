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
import { Controller, useFormContext } from "react-hook-form";

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
  //TODO: removed useTranslation() because it's not used, is it needed?
  const { control, register } = useFormContext();

  if (items.length === 0) return; // avoid mui out-of-range error
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <FormControl fullWidth margin="normal">
          <InputLabel id={`${name}-label`}>{props.label}</InputLabel>
          <Select
            {...props}
            {...register(name)}
            MenuProps={{ disableScrollLock: true }}
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
          <FormHelperText>{helperText}</FormHelperText>
        </FormControl>
      )}
    />
  );
}
