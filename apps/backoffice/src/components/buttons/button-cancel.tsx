import { Button } from "@mui/material";
import { useTranslation } from "next-i18next";
import { ButtonBaseProps } from ".";

export type ButtonCancelProps = ButtonBaseProps;

export const ButtonCancel = ({ disabled, onClick }: ButtonCancelProps) => {
  const { t } = useTranslation();

  return (
    <Button
      data-testid="bo-io-button-cancel"
      size="medium"
      variant="outlined"
      disabled={disabled}
      onClick={() => onClick()}
    >
      {t("buttons.cancel")}
    </Button>
  );
};
