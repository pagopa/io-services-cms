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
import { ButtonNaked } from "@pagopa/mui-italia";
import { useTranslation } from "next-i18next";
import { ReactNode } from "react";
import { Controller, get, useFormContext } from "react-hook-form";

export type MultiSelectControllerProps = {
  helperText?: ReactNode;
  items: { label: string; value: number | string }[]; //i’ve narrowed the type to { label: string; value: number | string }. This improves robustness and readability, removing ambiguous cases like arrays or undefined.
  loading: boolean;
  name: string;
} & SelectProps;

/** Controller for MUI `Select` component.\
 * Used for collecting multiple user provided information from a list of options. */

const getMultiSelectLogic = (
  items: { label: string; value: number | string }[],
  value: (number | string)[],
  onChange: (val: (number | string)[]) => void,
) => {
  const selected = Array.isArray(value) ? value : [];
  const allSelected = selected.length === items.length;

  const toggleItem = (itemValue: number | string) => {
    const newSelected = selected.includes(itemValue)
      ? selected.filter((v) => v !== itemValue)
      : [...selected, itemValue];
    onChange(newSelected);
  };

  const handleSelectAll = () => {
    const allValues = items.map((i) => i.value);
    onChange(allSelected ? [] : allValues);
  };

  return { allSelected, handleSelectAll, selected, toggleItem };
};

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
        const { allSelected, handleSelectAll, selected, toggleItem } =
          getMultiSelectLogic(items, value, onChange);

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
              renderValue={(selectedItems) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {(selectedItems as string[]).map((val) => {
                    const label =
                      items.find((i) => i.value === val)?.label || val;
                    return <Chip key={val} label={label} />;
                  })}
                </Box>
              )}
              value={selected}
            >
              <ButtonNaked
                color="primary"
                onClick={handleSelectAll}
                size="medium"
                sx={{ fontWeight: 700, padding: "8px 0 16px 28px" }}
              >
                {allSelected
                  ? t("forms.groups.associate.services.select.deselectAll")
                  : t("forms.groups.associate.services.select.selectAll")}
              </ButtonNaked>
              <Divider />
              {items.map((item) => (
                <MenuItem
                  key={item.value}
                  onClick={() => toggleItem(item.value)}
                >
                  <Checkbox checked={selected.includes(item.value)} />
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
