import { Box, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";

import { ButtonExit } from "../buttons";
import { LoaderSkeleton } from "../loaders";
import { PageBreadcrumbs } from "./page-breadcrumbs";
import { PageHtmlHeadTitle } from "./page-html-head-title";

export interface PageHeaderProps {
  description?: string;
  hideBreadcrumbs?: boolean;
  /** Event triggered on exit button click */
  onExitClick?: () => void;
  /** Displays an exit button, to abort the current page operation  */
  showExit?: boolean;
  title?: string;
  titleVariant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export const PageHeader = ({
  description,
  hideBreadcrumbs,
  onExitClick,
  showExit,
  title,
  titleVariant = "h4",
}: PageHeaderProps) => {
  const { t } = useTranslation();

  return (
    <>
      <PageHtmlHeadTitle section={title ?? ""} />
      {showExit ? (
        <Box id="bo-io-page-exit" marginBottom={2}>
          <ButtonExit onClick={onExitClick ?? (() => null)} />
        </Box>
      ) : null}
      {hideBreadcrumbs ? null : <PageBreadcrumbs />}
      <Box id="bo-io-page-title-descr" marginBottom={3}>
        <Typography marginBottom={2} variant={titleVariant}>
          <LoaderSkeleton
            loading={title === undefined}
            style={{ width: "100%" }}
          >
            {t(title ?? "")}
          </LoaderSkeleton>
        </Typography>
        {description ? (
          <Typography variant="body1">{t(description)}</Typography>
        ) : null}
      </Box>
    </>
  );
};
