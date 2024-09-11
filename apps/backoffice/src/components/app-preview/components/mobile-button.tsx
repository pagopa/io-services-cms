import { Button } from "@mui/material";

import { IOColors } from ".";
import { MobileTypography } from "./mobile-typography";

export interface MobileButtonProps {
  isPrimary?: boolean;
  text: string;
}

/** Render IO App button with **Readex Pro** font */
export const MobileButton = ({ isPrimary, text }: MobileButtonProps) => {
  const buttonPrimaryStyles = {
    "&:hover": {
      backgroundColor: IOColors["blueIO-500"],
    },
    backgroundColor: IOColors["blueIO-500"],
    borderRadius: "8px",
  };

  const buttonSecondaryStyles = {
    "&:hover": {
      backgroundColor: IOColors["white"],
    },
  };

  return (
    <Button
      fullWidth
      sx={isPrimary ? buttonPrimaryStyles : buttonSecondaryStyles}
      variant={isPrimary ? "contained" : "text"}
    >
      <MobileTypography
        color={isPrimary ? IOColors["white"] : IOColors["blueIO-500"]}
        fontSize="16px"
        fontWeight={600}
      >
        {text}
      </MobileTypography>
    </Button>
  );
};
