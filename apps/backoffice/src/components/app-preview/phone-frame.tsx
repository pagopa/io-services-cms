import { Box } from "@mui/material";
import { ReactNode } from "react";

type PhoneFrameProps = {
  children: ReactNode;
};

const PhoneFrame = ({ children }: PhoneFrameProps) => {
  return (
    <Box
      display="flex"
      padding={1}
      borderRadius={6}
      bgcolor="rgba(255, 255, 255, 0.35)"
    >
      <Box borderRadius={4} bgcolor="background.paper" overflow="hidden">
        {children}
      </Box>
    </Box>
  );
};

export default PhoneFrame;
