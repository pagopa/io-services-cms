import { Button } from "@mui/material";
import { useTranslation } from "next-i18next";

import { ButtonBaseProps } from ".";

export type ButtonCancelProps = ButtonBaseProps;

export const ButtonCancel = ({ disabled, onClick }: ButtonCancelProps) => {
  const { t } = useTranslation();

  return (
    <Button
      data-testid="bo-io-button-cancel"
      disabled={disabled}
      onClick={() => onClick()}
      size="medium"
      variant="outlined"
    >
      {t("buttons.cancel")}
    </Button>
  );
};
