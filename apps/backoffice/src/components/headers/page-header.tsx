import { Box, Breadcrumbs, Typography } from "@mui/material";
import { useRouter } from "next/router";

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

export const PageHeader = ({ title, subtitle }: PageHeaderProps) => {
  const router = useRouter();
  const getRoutePath = (): string[] => {
    return router.pathname.split("/");
  };

  return (
    <Box>
      <Box>
        <Breadcrumbs>
          {getRoutePath().map((section, index, sections) =>
            index > 0 && sections.length > 2 ? (
              <Typography
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                }}
                color="inherit"
                fontWeight={
                  index > 0 && index < sections.length - 1 ? 400 : 600
                }
              >
                {section}
              </Typography>
            ) : null
          )}
        </Breadcrumbs>
      </Box>
      <Box margin={"8px 0"}>
        <Typography variant="h4">{title}</Typography>
      </Box>
      {subtitle ? (
        <Box marginBottom={"24px"}>
          <Typography variant="body1">{subtitle}</Typography>
        </Box>
      ) : null}
    </Box>
  );
};
