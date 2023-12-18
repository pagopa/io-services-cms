import {
  Autocomplete,
  FormControl,
  FormHelperText,
  TextField
} from "@mui/material";
import { ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";

export type AutocompleteControllerProps = {
  name: string;
  items: AutocompleteOption[];
  label?: ReactNode;
  placeholder?: string;
  helperText?: ReactNode;
};

export type AutocompleteOption = {
  label: string;
  id: string | number | undefined;
};

/** Controller for MUI `Autocomplete` component.\
 * The autocomplete is a normal text input enhanced by a panel of suggested options. */
export function AutocompleteController({
  name,
  items,
  label,
  placeholder,
  helperText
}: AutocompleteControllerProps) {
  const { register, control } = useFormContext();

  if (items.length === 0) return; // avoid mui out-of-range error
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => (
        <FormControl fullWidth margin="normal">
          <Autocomplete
            {...register(name)}
            id={name}
            value={value}
            onChange={(_, v) => onChange(v?.id ?? "")}
            fullWidth
            disablePortal
            options={items}
            getOptionLabel={o =>
              items.find(i =>
                typeof o === "number" ? i.id === o : i.id === o.id
              )?.label ?? ""
            }
            isOptionEqualToValue={(o, v) =>
              typeof v === "number" ? o.id === v : false
            }
            renderInput={params => (
              <TextField {...params} label={label} placeholder={placeholder} />
            )}
          />
          <FormHelperText>{helperText}</FormHelperText>
        </FormControl>
      )}
    />
  );
}
