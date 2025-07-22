import { LoaderSkeleton } from "@/components/loaders";
import {
  Box,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  SelectProps,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import React, { ReactNode } from "react";
import { Controller, get, useFormContext } from "react-hook-form";

export type MultiSelectControllerProps = {
  helperText?: ReactNode;
  items: { label: string; value: number | string }[]; //i’ve narrowed the type to { label: string; value: number | string }. This improves robustness and readability, removing ambiguous cases like arrays or undefined.
  loading: boolean;
  name: string;
} & SelectProps;

/** Controller for MUI `Select` component.\
 * Used for collecting multiple user provided information from a list of options. */
export function MultiSelectController({
  helperText,
  items,
  loading,
  name,
  ...props
}: MultiSelectControllerProps) {
  const { control, formState } = useFormContext();
  const error = get(formState.errors, name);
  const { t } = useTranslation();

  if (loading) {
    return (
      <LoaderSkeleton loading style={{ height: 87, width: "100%" }}>
        {null}
      </LoaderSkeleton>
    );
  }

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value = [] } }) => {
        const selected = Array.isArray(value) ? value : [];
        const allSelected = selected.length === items.length;
        const showDeselect = selected.length >= 2;
        const isIndeterminate = selected.length > 0 && !allSelected;

        const toggleItem = (itemValue: number | string) => {
          const newSelected = selected.includes(String(itemValue))
            ? selected.filter((v) => v !== String(itemValue))
            : [...selected, String(itemValue)];
          onChange(newSelected);
        };

        const handleSelectAll = () => {
          onChange(allSelected ? [] : items.map((i) => String(i.value)));
        };

        const handleDeselectAll = () => {
          onChange([]);
        };

        return (
          <FormControl error={!!error} fullWidth margin="normal">
            <InputLabel id={`${name}-label`} required={props.required}>
              {props.label}
            </InputLabel>
            <Select
              {...props}
              MenuProps={{
                PaperProps: { style: { maxHeight: 400 } },
                disableScrollLock: true,
              }}
              fullWidth
              input={<OutlinedInput label={props.label} />}
              labelId={`${name}-label`}
              multiple
              onChange={() => {
                //
              }} // handled manually
              renderValue={(selectedItems) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {(selectedItems as string[]).map((val) => {
                    const label =
                      items.find((i) => String(i.value) === val)?.label || val;
                    return <Chip key={val} label={label} />;
                  })}
                </Box>
              )}
              value={selected}
            >
              {items.length > 1 && (
                <MenuItem key="select-all" onClick={handleSelectAll}>
                  <Checkbox
                    checked={allSelected}
                    indeterminate={isIndeterminate}
                  />
                  <ListItemText
                    primary={t(
                      "forms.groups.associate.services.select.labels.selectAll",
                    )}
                    sx={{ color: "#0073E6" }}
                  />
                </MenuItem>
              )}

              {showDeselect && (
                <MenuItem key="deselect-all" onClick={handleDeselectAll}>
                  <Checkbox checked={false} />
                  <ListItemText
                    primary={t(
                      "forms.groups.associate.services.select.labels.deselectAll",
                    )}
                    sx={{ color: "#0073E6" }}
                  />
                </MenuItem>
              )}

              <Divider />

              {items.map((item) => (
                <MenuItem
                  key={String(item.value)}
                  onClick={() => toggleItem(item.value)}
                >
                  <Checkbox checked={selected.includes(String(item.value))} />
                  <ListItemText primary={item.label} />
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {error ? error.message : helperText}
            </FormHelperText>
          </FormControl>
        );
      }}
    />
  );
}
