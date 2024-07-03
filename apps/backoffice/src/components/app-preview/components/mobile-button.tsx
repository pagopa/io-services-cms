import { Button } from "@mui/material";
import { MOBILE_COLOR_BLUE_IO_500, MOBILE_COLOR_WHITE } from ".";
import { MobileTypography } from "./mobile-typography";

export type MobileButtonProps = {
  text: string;
  isPrimary?: boolean;
};

/** Render IO App button with **Readex Pro** font */
export const MobileButton = ({ text, isPrimary }: MobileButtonProps) => {
  const buttonPrimaryStyles = {
    borderRadius: "8px",
    backgroundColor: MOBILE_COLOR_BLUE_IO_500,
    "&:hover": {
      backgroundColor: MOBILE_COLOR_BLUE_IO_500
    }
  };

  const buttonSecondaryStyles = {
    "&:hover": {
      backgroundColor: MOBILE_COLOR_WHITE
    }
  };

  return (
    <Button
      variant={isPrimary ? "contained" : "text"}
      sx={isPrimary ? buttonPrimaryStyles : buttonSecondaryStyles}
      fullWidth
    >
      <MobileTypography
        fontSize="16px"
        fontWeight={600}
        color={isPrimary ? MOBILE_COLOR_WHITE : MOBILE_COLOR_BLUE_IO_500}
      >
        {text}
      </MobileTypography>
    </Button>
  );
};
