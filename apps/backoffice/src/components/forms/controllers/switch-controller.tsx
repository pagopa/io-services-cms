import {
  Box,
  FormControlLabel,
  Switch,
  SwitchProps,
  Typography,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

export type SwitchControllerProps = {
  helperText?: string;
  label: string;
  name: string;
} & SwitchProps;

/** Controller for MUI `Switch` component.\
 * Switches toggle the state of a single setting on or off. */
export function SwitchController({
  helperText,
  label,
  name,
  ...props
}: SwitchControllerProps) {
  const { control, register } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
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
            dangerouslySetInnerHTML={{
              __html: helperText ?? "",
            }}
            fontSize="12px"
            fontWeight={600}
            paddingX="14px"
          ></Typography>
        </Box>
      )}
    />
  );
}
