import {
  Box,
  FormControlLabel,
  Switch,
  SwitchProps,
  Typography
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

export type SwitchControllerProps = {
  name: string;
  label: string;
  helperText?: string;
} & SwitchProps;

/** Controller for MUI `Switch` component.\
 * Switches toggle the state of a single setting on or off. */
export function SwitchController({
  name,
  label,
  helperText,
  ...props
}: SwitchControllerProps) {
  const { register, control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => (
        <Box padding={1}>
          <FormControlLabel
            control={
              <Switch
                {...register(name)}
                {...props}
                checked={value}
                onChange={onChange}
              />
            }
            label={label}
          />
          <Typography
            color="text.secondary"
            fontSize="12px"
            fontWeight={600}
            paddingX="14px"
            dangerouslySetInnerHTML={{
              __html: helperText ?? ""
            }}
          ></Typography>
        </Box>
      )}
    />
  );
}
