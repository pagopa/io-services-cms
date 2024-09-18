import { Button, CircularProgress } from "@mui/material";
import { useTranslation } from "next-i18next";

import { ButtonBaseProps } from ".";

export type ButtonWithLoaderProps = {
  /** If `true`, the button will take up the full width of its container. */
  fullWidth?: boolean;
  /** Button text */
  label: string;
  /** If `true`, the component shows a centered `CircularProgress` inside.
   *
   * @default false */
  loading?: boolean;
} & ButtonBaseProps;

export const ButtonWithLoader = ({
  disabled,
  endIcon,
  fullWidth,
  label,
  loading,
  onClick,
  startIcon,
  sx,
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
        data-testid="bo-io-button-with-loader"
        disabled={disabled || loading}
        endIcon={endIcon}
        fullWidth={fullWidth}
        onClick={handleButtonClick}
        size="medium"
        startIcon={startIcon}
        sx={sx}
        type="submit"
        variant="contained"
      >
        {t(label)}
      </Button>
      {loading && (
        <CircularProgress
          color="primary"
          data-testid="bo-io-button-with-loader-circular-progress"
          size={32}
          sx={{
            left: "50%",
            marginLeft: "-12px",
            marginTop: "-12px",
            position: "absolute",
            top: "50%",
          }}
        />
      )}
    </span>
  );
};
