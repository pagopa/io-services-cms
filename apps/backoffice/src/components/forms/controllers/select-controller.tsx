import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectProps
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";

export type SelectControllerProps = {
  name: string;
  items: {
    label: string;
    value: string | number | readonly string[] | undefined;
  }[];
  helperText?: ReactNode;
} & SelectProps;

/** Controller for MUI `Select` component.\
 * Used for collecting user provided information from a list of options. */
export function SelectController({
  name,
  items,
  helperText,
  ...props
}: SelectControllerProps) {
  const { t } = useTranslation();
  const { register, control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => (
        <FormControl fullWidth margin="normal">
          <InputLabel id={`${name}-label`}>{props.label}</InputLabel>
          <Select
            {...props}
            {...register(name)}
            id={name}
            labelId={`${name}-label`}
            value={value}
            onChange={onChange}
            fullWidth
            input={<OutlinedInput id="select-label" label={props.label} />}
            MenuProps={{ disableScrollLock: true }}
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
