import { Checkbox, Grid, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ToggleWithLabelProps {
  initial: boolean;
  label: string;
  onChange?: (val: boolean) => void;
}

export const CheckboxToggleWithLabel: React.FC<ToggleWithLabelProps> = ({
  initial,
  label,
  onChange,
}) => {
  const { t } = useTranslation();
  const [val, setVal] = useState(initial);

  return (
    <Grid alignItems="center" container mb={2} mt={2}>
      <Grid item>
        <Checkbox
          checked={val}
          onChange={(e) => {
            const next = e.target.checked;
            setVal(next);
            onChange?.(next);
          }}
        />
      </Grid>
      <Grid item>
        <Typography
          dangerouslySetInnerHTML={{
            __html: t(label),
          }}
        />
      </Grid>
    </Grid>
  );
};
