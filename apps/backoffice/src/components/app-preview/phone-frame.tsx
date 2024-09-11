import { Box } from "@mui/material";
import { ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
}

const PhoneFrame = ({ children }: PhoneFrameProps) => (
  <Box
    bgcolor="rgba(255, 255, 255, 0.35)"
    borderRadius={6}
    display="flex"
    padding={1}
  >
    <Box bgcolor="background.paper" borderRadius={4} overflow="hidden">
      {children}
    </Box>
  </Box>
);

export default PhoneFrame;
