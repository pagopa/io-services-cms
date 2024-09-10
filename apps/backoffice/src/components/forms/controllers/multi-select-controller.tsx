import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectProps,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";

export type MultiSelectControllerProps = {
  items: {
    label: string;
    value: string;
  }[];
  name: string;
} & SelectProps;

/** Controller for MUI `Select` component.\
 * Used for collecting multiple user provided information from a list of options. */
export function MultiSelectController({
  items,
  name,
  ...props
}: MultiSelectControllerProps) {
  const { t } = useTranslation();
  const { control, register } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <FormControl fullWidth margin="normal">
          <InputLabel id={`${name}-label`}>{props.label}</InputLabel>
          <Select
            {...register(name)}
            MenuProps={{ disableScrollLock: true }}
            disabled={props.disabled}
            fullWidth
            id={name}
            input={
              <OutlinedInput id="select-multiple-chip" label={props.label} />
            }
            labelId={`${name}-label`}
            multiple
            onChange={onChange}
            renderValue={(selected) => (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 0.5,
                }}
              >
                {selected.map((value: React.Key | null | undefined) => (
                  <Chip
                    key={value}
                    label={items.find((item) => item.value === value)?.label}
                  />
                ))}
              </Box>
            )}
            value={[]}
          >
            {items.map((item, keyIndex) => (
              <MenuItem key={keyIndex} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    />
  );
}
