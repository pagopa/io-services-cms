import { Button } from "@mui/material";
import { useTranslation } from "next-i18next";
import { ButtonBaseProps } from ".";

export type ButtonNextProps = {
  label?: string;
} & ButtonBaseProps;

export const ButtonNext = ({
  label = "buttons.next",
  disabled,
  onClick
}: ButtonNextProps) => {
  const { t } = useTranslation();

  return (
    <Button
      data-testid="bo-io-button-next"
      type="submit"
      size="medium"
      variant="contained"
      disabled={disabled}
      onClick={() => onClick()}
    >
      {t(label)}
    </Button>
  );
};
