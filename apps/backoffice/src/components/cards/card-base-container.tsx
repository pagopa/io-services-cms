import { Box } from "@mui/material";
import { ReactNode } from "react";

export type CardBaseContainerProps = {
  children: ReactNode;
};

/** Render card basic container box with white background and 24px padding */
export const CardBaseContainer = ({ children }: CardBaseContainerProps) => {
  return (
    <Box
      bgcolor="background.paper"
      id="card-details"
      padding={3}
      borderRadius={0.5}
    >
      {children}
    </Box>
  );
};
