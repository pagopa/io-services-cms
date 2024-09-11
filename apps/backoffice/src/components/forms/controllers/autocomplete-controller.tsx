import {
  Autocomplete,
  FormControl,
  FormHelperText,
  TextField,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { ReactNode } from "react";
import { Controller, get, useFormContext } from "react-hook-form";

export interface AutocompleteControllerProps {
  helperText?: ReactNode;
  items: AutocompleteOption[];
  label?: ReactNode;
  name: string;
  placeholder?: string;
}

export interface AutocompleteOption {
  id: number | string | undefined;
  label: string;
}

/** Controller for MUI `Autocomplete` component.\
 * The autocomplete is a normal text input enhanced by a panel of suggested options. */
export function AutocompleteController({
  helperText,
  items,
  label,
  name,
  placeholder,
}: AutocompleteControllerProps) {
  const { t } = useTranslation();
  const { control, formState, register } = useFormContext();
  const error = get(formState.errors, name);

  if (items.length === 0) return; // avoid mui out-of-range error
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <FormControl fullWidth margin="normal">
          <Autocomplete
            {...register(name)}
            clearOnBlur
            disablePortal
            freeSolo
            fullWidth
            getOptionLabel={(o) =>
              items.find((i) =>
                typeof o === "number" ? i.id === o : i.id === o.id,
              )?.label ?? ""
            }
            id={name}
            isOptionEqualToValue={(o, v) =>
              typeof v === "number" ? o.id === v : false
            }
            noOptionsText={t("forms.noOptionsText")}
            onChange={(_, v) => onChange(v?.id ?? "")}
            options={items}
            renderInput={(params) => (
              <TextField
                {...params}
                error={!!error}
                label={label}
                placeholder={placeholder}
              />
            )}
            value={value}
          />
          <FormHelperText error={!!error}>
            {error ? error.message : (helperText ?? null)}
          </FormHelperText>
        </FormControl>
      )}
    />
  );
}
