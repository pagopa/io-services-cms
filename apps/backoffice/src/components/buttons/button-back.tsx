import { Button } from "@mui/material";
import { useTranslation } from "next-i18next";

import { ButtonBaseProps } from ".";

export type ButtonBackProps = ButtonBaseProps;

export const ButtonBack = ({ disabled, onClick }: ButtonBackProps) => {
  const { t } = useTranslation();

  return (
    <Button
      data-testid="bo-io-button-back"
      disabled={disabled}
      onClick={() => onClick()}
      size="medium"
      variant="outlined"
    >
      {t("buttons.back")}
    </Button>
  );
};
