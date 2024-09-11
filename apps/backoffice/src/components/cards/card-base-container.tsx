import { Box } from "@mui/material";
import { ReactNode } from "react";

export interface CardBaseContainerProps {
  children: ReactNode;
}

/** Render card basic container box with white background and 24px padding */
export const CardBaseContainer = ({ children }: CardBaseContainerProps) => (
  <Box
    bgcolor="background.paper"
    borderRadius={0.5}
    height="100%"
    id="card-details"
    padding={3}
  >
    {children}
  </Box>
);
