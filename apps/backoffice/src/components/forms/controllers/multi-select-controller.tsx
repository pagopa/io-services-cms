import { LoaderSkeleton } from "@/components/loaders";
import {
  Box,
  Chip,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectProps,
} from "@mui/material";
import React, { ReactNode } from "react";
import { Controller, get, useFormContext } from "react-hook-form";

export type MultiSelectControllerProps = {
  helperText?: ReactNode;
  items: {
    label: string;
    value: number | readonly string[] | string | undefined;
  }[];
  name: string;
} & SelectProps;

/** Controller for MUI `Select` component.\
 * Used for collecting multiple user provided information from a list of options. */
export function MultiSelectController({
  helperText,
  items,
  name,
  ...props
}: MultiSelectControllerProps) {
  const { control, formState, register } = useFormContext();
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
            disabled={props.disabled}
            error={!!error}
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
            value={value ?? []}
          >
            {items.map((item, keyIndex) => (
              <MenuItem key={keyIndex} value={item.value}>
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
