import { ArrowBack } from "@mui/icons-material";
import { ButtonNaked } from "@pagopa/mui-italia";
import { useTranslation } from "next-i18next";

import { useDialog } from "../dialog-provider";

export interface ButtonExitProps {
  onClick: () => void;
}

/**
 * Implements and displays an exit button, including the logic for opening a confirmation modal.
 *
 * If so _(the user confirms the exit action via the modal window)_, an `onClick` event is triggered.
 */
export const ButtonExit = ({ onClick }: ButtonExitProps) => {
  const { t } = useTranslation();
  const showDialog = useDialog();

  const handleExit = async () => {
    const confirmed = await showDialog({
      message: t("forms.cancel.description"),
      title: t("forms.cancel.title"),
    });
    if (confirmed) {
      onClick();
    } else {
      console.log("modal cancelled");
    }
  };

  return (
    <ButtonNaked
      color="primary"
      data-testid="bo-io-button-exit"
      onClick={handleExit}
      size="medium"
      startIcon={<ArrowBack />}
    >
      {t("buttons.exit")}
    </ButtonNaked>
  );
};
