import { Box } from "@mui/material";
import { ReactNode } from "react";

type PageLayoutProps = {
  isFullWidth?: boolean;
  children: ReactNode;
};

export const PageLayout = ({
  isFullWidth = true,
  children
}: PageLayoutProps) => {
  return (
    <Box
      padding={3}
      width={isFullWidth ? "100%" : "60%"}
      marginX={isFullWidth ? "" : "auto"}
    >
      {children}
    </Box>
  );
};
