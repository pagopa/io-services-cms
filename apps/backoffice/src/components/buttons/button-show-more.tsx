import { Button } from "@mui/material";
import { useTranslation } from "next-i18next";

import { ButtonBaseProps } from ".";

export type ButtonShowMoreProps = ButtonBaseProps;

export const ButtonShowMore = ({ disabled, onClick }: ButtonShowMoreProps) => {
  const { t } = useTranslation();

  return (
    <Button
      data-testid="bo-io-button-show-more"
      disabled={disabled}
      onClick={() => onClick()}
      size="small"
      variant="text"
    >
      {t("buttons.showMore")}
    </Button>
  );
};
