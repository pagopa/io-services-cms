import { Checkbox, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface ServiceAutopublishCheckboxProps {
  onChange: (checked: boolean) => void;
}

export function ServiceAutopublishCheckbox({
  onChange,
}: ServiceAutopublishCheckboxProps) {
  const { t } = useTranslation();

  return (
    <Stack alignItems="center" direction="row" mt={2}>
      <Checkbox
        onChange={(_, checked) => {
          onChange(checked);
        }}
      />
      <Typography>
        {t("service.submitReview.modal.publishAfterApproval")}
      </Typography>
    </Stack>
  );
}
