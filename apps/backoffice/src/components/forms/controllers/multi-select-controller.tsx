import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectProps
} from "@mui/material";
import { useTranslation } from "next-i18next";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";

export type MultiSelectControllerProps = {
  name: string;
  items: {
    label: string;
    value: string;
  }[];
} & SelectProps;

/** Controller for MUI `Select` component.\
 * Used for collecting multiple user provided information from a list of options. */
export function MultiSelectController({
  name,
  items,
  ...props
}: MultiSelectControllerProps) {
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
            {...register(name)}
            id={name}
            labelId={`${name}-label`}
            value={[]}
            onChange={onChange}
            fullWidth
            multiple
            disabled={props.disabled}
            input={
              <OutlinedInput id="select-multiple-chip" label={props.label} />
            }
            renderValue={selected => (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 0.5
                }}
              >
                {selected.map((value: React.Key | null | undefined) => (
                  <Chip
                    key={value}
                    label={items.find(item => item.value === value)?.label}
                  />
                ))}
              </Box>
            )}
            MenuProps={{ disableScrollLock: true }}
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
