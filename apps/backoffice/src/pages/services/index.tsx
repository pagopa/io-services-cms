import { AccessControl } from "@/components/access-control";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/headers";
import { AppLayout, PageLayout } from "@/layouts";
import { Add } from "@mui/icons-material";
import { Box, Button, Grid } from "@mui/material";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import NextLink from "next/link";
import { ReactElement } from "react";

const pageTitleLocaleKey = "routes.services.title";
const pageDescriptionLocaleKey = "routes.services.description";

const CREATE_SERVICE_ROUTE = "/services/new-service";

export default function Services() {
  const { t } = useTranslation();

  return (
    <>
      <Grid container spacing={0} paddingRight={3}>
        <Grid item xs>
          <PageHeader
            title={pageTitleLocaleKey}
            description={pageDescriptionLocaleKey}
          />
        </Grid>
        <Grid item xs="auto">
          <AccessControl requiredPermissions={["ApiServiceWrite"]}>
            <NextLink
              href={CREATE_SERVICE_ROUTE}
              passHref
              style={{ textDecoration: "none" }}
            >
              <Button size="medium" variant="contained" startIcon={<Add />}>
                {t("service.actions.create")}
              </Button>
            </NextLink>
          </AccessControl>
        </Grid>
      </Grid>
      <EmptyState
        emptyStateLabel="routes.services.empty"
        ctaLabel="service.actions.create"
        ctaRoute={CREATE_SERVICE_ROUTE}
        requiredPermissions={["ApiServiceWrite"]}
      />
      <Box paddingY={3}>
        <NextLink
          href={`/services/TEST12345678901234567890AB`}
          passHref
          style={{ textDecoration: "none" }}
        >
          <Button size="small" variant="contained">
            Test dettaglio servizio
          </Button>
        </NextLink>
      </Box>
    </>
  );
}

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      // pass the translation props to the page component
      ...(await serverSideTranslations(locale))
    }
  };
}

Services.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout>
      <PageLayout>{page}</PageLayout>
    </AppLayout>
  );
};
