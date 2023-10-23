import { Button } from "@mui/material";
import { useTranslation } from "next-i18next";
import { ButtonBaseProps } from ".";

export type ButtonNextProps = {} & ButtonBaseProps;

export const ButtonNext = ({ disabled, onClick }: ButtonNextProps) => {
  const { t } = useTranslation();

  return (
    <Button
      type="submit"
      size="medium"
      variant="contained"
      disabled={disabled}
      onClick={() => onClick()}
    >
      {t("buttons.next")}
    </Button>
  );
};
