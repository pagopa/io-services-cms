import { Button } from "@mui/material";
import { IOColors } from ".";
import { MobileTypography } from "./mobile-typography";

export type MobileButtonProps = {
  text: string;
  isPrimary?: boolean;
};

/** Render IO App button with **Readex Pro** font */
export const MobileButton = ({ text, isPrimary }: MobileButtonProps) => {
  const buttonPrimaryStyles = {
    borderRadius: "8px",
    backgroundColor: IOColors["blueIO-500"],
    "&:hover": {
      backgroundColor: IOColors["blueIO-500"]
    }
  };

  const buttonSecondaryStyles = {
    "&:hover": {
      backgroundColor: IOColors["white"]
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
        color={isPrimary ? IOColors["white"] : IOColors["blueIO-500"]}
      >
        {text}
      </MobileTypography>
    </Button>
  );
};
