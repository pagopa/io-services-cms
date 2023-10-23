import { Button, CircularProgress } from "@mui/material";
import { useTranslation } from "next-i18next";
import { ButtonBaseProps } from ".";

export type ButtonCreateDraftProps = {
  loading?: boolean;
} & ButtonBaseProps;

export const ButtonCreateDraft = ({
  loading,
  disabled,
  onClick
}: ButtonCreateDraftProps) => {
  const { t } = useTranslation();

  const handleButtonClick = () => {
    if (!loading) {
      onClick();
    }
  };

  return (
    <span style={{ position: "relative" }}>
      <Button
        type="submit"
        size="medium"
        variant="contained"
        disabled={disabled || loading}
        onClick={handleButtonClick}
      >
        {t("buttons.createDraft")}
      </Button>
      {loading && (
        <CircularProgress
          size={32}
          color="primary"
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            marginTop: "-12px",
            marginLeft: "-12px"
          }}
        />
      )}
    </span>
  );
};
