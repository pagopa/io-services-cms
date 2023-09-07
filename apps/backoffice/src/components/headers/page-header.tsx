import { Box, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import { PageBreadcrumbs } from "./page-breadcrumbs";
import { PageHtmlHeadTitle } from "./page-html-head-title";

export type PageHeaderProps = {
  title: string;
  description?: string;
};

export const PageHeader = ({ title, description }: PageHeaderProps) => {
  const { t } = useTranslation();

  return (
    <>
      <PageHtmlHeadTitle section={title} />
      <PageBreadcrumbs />
      <Box marginBottom={3} id="bo-io-page-title-descr">
        <Typography marginBottom={2} variant="h4">
          {t(title)}
        </Typography>
        {description ? (
          <Typography variant="body1">{t(description)}</Typography>
        ) : null}
      </Box>
    </>
  );
};
