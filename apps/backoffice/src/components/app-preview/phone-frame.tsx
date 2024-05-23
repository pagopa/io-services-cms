import { Box } from "@mui/material";
import React, { ReactNode } from "react";

type PhoneFrameProps = {
  children: ReactNode;
};

const PhoneFrame = ({ children }: PhoneFrameProps) => {
  return (
    <Box
      display="flex"
      padding={1}
      borderRadius={6}
      sx={{
        backgroundColor: "rgba(255, 255, 255, 0.35)"
      }}
    >
      <Box
        borderRadius={4}
        sx={{
          backgroundColor: "white"
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default PhoneFrame;
