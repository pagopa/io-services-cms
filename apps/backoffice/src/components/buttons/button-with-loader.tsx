import { Button, CircularProgress } from "@mui/material";
import { useTranslation } from "next-i18next";
import { ButtonBaseProps } from ".";

export type ButtonWithLoaderProps = {
  /** If `true`, the component shows a centered `CircularProgress` inside.
   *
   * @default false */
  loading?: boolean;
  /** Button text */
  label: string;
  /** If `true`, the button will take up the full width of its container. */
  fullWidth?: boolean;
} & ButtonBaseProps;

export const ButtonWithLoader = ({
  loading,
  label,
  fullWidth,
  startIcon,
  endIcon,
  sx,
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
        data-testid="bo-test-id-button-with-loader"
        type="submit"
        size="medium"
        variant="contained"
        disabled={disabled || loading}
        onClick={handleButtonClick}
        fullWidth={fullWidth}
        startIcon={startIcon}
        endIcon={endIcon}
        sx={sx}
      >
        {t(label)}
      </Button>
      {loading && (
        <CircularProgress
          data-testid="bo-test-id-button-with-loader-loader"
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
