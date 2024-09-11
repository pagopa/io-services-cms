import { Button } from "@mui/material";
import { useTranslation } from "next-i18next";

import { ButtonBaseProps } from ".";

export type ButtonNextProps = {
  label?: string;
} & ButtonBaseProps;

export const ButtonNext = ({
  disabled,
  label = "buttons.next",
  onClick,
}: ButtonNextProps) => {
  const { t } = useTranslation();

  return (
    <Button
      data-testid="bo-io-button-next"
      disabled={disabled}
      onClick={() => onClick()}
      size="medium"
      type="submit"
      variant="contained"
    >
      {t(label)}
    </Button>
  );
};
