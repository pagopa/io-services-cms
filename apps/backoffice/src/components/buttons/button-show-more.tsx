import { Button } from "@mui/material";
import { useTranslation } from "next-i18next";
import { ButtonBaseProps } from ".";

export type ButtonShowMoreProps = ButtonBaseProps;

export const ButtonShowMore = ({ disabled, onClick }: ButtonShowMoreProps) => {
  const { t } = useTranslation();

  return (
    <Button
      data-testid="bo-io-button-show-more"
      size="small"
      variant="text"
      disabled={disabled}
      onClick={() => onClick()}
    >
      {t("buttons.showMore")}
    </Button>
  );
};
