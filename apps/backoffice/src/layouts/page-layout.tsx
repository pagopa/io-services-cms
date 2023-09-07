import { PageHeader } from "@/components/headers";
import { Box } from "@mui/material";
import { ReactNode } from "react";

type PageLayoutProps = {
  title: string;
  subtitle?: string;
  isFullWidth?: boolean;
  children: ReactNode;
};

export const PageLayout = ({
  title,
  subtitle,
  isFullWidth = true,
  children
}: PageLayoutProps) => {
  return (
    <Box
      padding={3}
      width={isFullWidth ? "100%" : "60%"}
      marginX={isFullWidth ? "" : "auto"}
      bgcolor={"#F5F5F5"}
    >
      <PageHeader title={title} subtitle={subtitle} />
      <Box>{children}</Box>
    </Box>
  );
};
