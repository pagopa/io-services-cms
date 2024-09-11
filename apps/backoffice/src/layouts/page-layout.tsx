import { Box } from "@mui/material";
import { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  isFullWidth?: boolean;
}

export const PageLayout = ({
  children,
  isFullWidth = true,
}: PageLayoutProps) => (
  <Box
    display="flex"
    flexDirection="column"
    marginX={isFullWidth ? "" : "auto"}
    padding={3}
    width={isFullWidth ? "100%" : "60%"}
  >
    {children}
  </Box>
);
