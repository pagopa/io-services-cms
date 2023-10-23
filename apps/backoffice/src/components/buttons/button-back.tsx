import { useTranslation } from "next-i18next";
import { Button } from "@mui/material";
import { ButtonBaseProps } from ".";

export type ButtonBackProps = {} & ButtonBaseProps;

export const ButtonBack = ({ disabled, onClick }: ButtonBackProps) => {
  const { t } = useTranslation();

  return (
    <Button
      size="medium"
      variant="outlined"
      disabled={disabled}
      onClick={() => onClick()}
    >
      {t("buttons.back")}
    </Button>
  );
};
