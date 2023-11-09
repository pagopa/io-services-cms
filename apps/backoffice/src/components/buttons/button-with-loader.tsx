import { Button, CircularProgress } from "@mui/material";
import { useTranslation } from "next-i18next";
import { ButtonBaseProps } from ".";

export type ButtonWithLoaderProps = {
  loading?: boolean;
  label: string;
  fullWidth?: boolean;
} & ButtonBaseProps;

export const ButtonWithLoader = ({
  loading,
  label,
  fullWidth,
  disabled,
  onClick
}: ButtonWithLoaderProps) => {
  const { t } = useTranslation();

  const handleButtonClick = () => {
    if (!loading) {
      onClick();
    }
  };

  return (
    <span style={{ position: "relative", width: fullWidth ? "100%" : "" }}>
      <Button
        type="submit"
        size="medium"
        variant="contained"
        disabled={disabled || loading}
        onClick={handleButtonClick}
        fullWidth={fullWidth}
      >
        {t(label)}
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
