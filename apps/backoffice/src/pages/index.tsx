import { AccessControl } from "@/components/access-control";
import { ApiKeysCard } from "@/components/api-keys/api-keys-card";
import { Banner } from "@/components/banner";
import { CardDetails } from "@/components/cards";
import { PageHeader } from "@/components/headers";
import { MigrationManager } from "@/components/services/subscriptions-migration";
import { Institution } from "@/generated/api/Institution";
import useFetch from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
import { trackOverviewPageEvent } from "@/utils/mix-panel";
import { Grid } from "@mui/material";
import mixpanel from "mixpanel-browser";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ReactElement, useEffect } from "react";

const pageTitleLocaleKey = "routes.overview.title";
const pageDescriptionLocaleKey = "routes.overview.description";

export default function Home() {
  const { t } = useTranslation();
  const { data: session } = useSession();

  const { data: instData, fetchData: instFetchData } = useFetch<Institution>();

  useEffect(() => {
    instFetchData(
      "getInstitution",
      { institutionId: session?.user?.institution.id as string },
      Institution,
      {
        notify: "errors",
      },
    );
    const mixpanelSuperProperties = {
      institution_id: session?.user?.institution.id,
      organization_fiscal_code: session?.user?.institution.fiscalCode,
      organization_name: session?.user?.institution.name,
      user_role: session?.user?.institution.role,
    };
    mixpanel.register(mixpanelSuperProperties);
    trackOverviewPageEvent();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // TODO Temporary Static Banner. Will be replaced with dynamic target development
  const temp_banner_title = "Novità!";
  const temp_banner_description =
    "Disponibile dal 31/03/2025 la funzionalità dei **Gruppi** per IO. " +
    "Permette di gestire i servizi limitando l’accesso a gruppi specifici di utenti." +
    "\n\n[Come funziona?](https://developer.pagopa.it/app-io/guides/io-guida-tecnica/funzionalita/pubblicare-un-servizio/gestire-laccesso-ai-servizi-tramite-i-gruppi)";

  return (
    <>
      <Banner
        description={temp_banner_description}
        severity="info"
        title={temp_banner_title}
      />
      <PageHeader
        description={pageDescriptionLocaleKey}
        title={pageTitleLocaleKey}
      />
      <Grid container spacing={2}>
        <Grid item lg={7} md={7} sm={12} xl={7} xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <CardDetails
                rows={[
                  {
                    label: "institution.name",
                    value: instData?.description,
                  },
                  {
                    label: "institution.institutionType.label",
                    value: instData?.institutionType
                      ? t(
                          `institution.institutionType.${instData.institutionType}`,
                        )
                      : undefined,
                  },
                  {
                    label: "institution.digitalAddress",
                    value: instData?.digitalAddress,
                  },
                  {
                    label: "institution.fiscalCode",
                    value: instData?.taxCode,
                  },
                  {
                    label: "institution.geographicArea",
                    value: instData?.geographicTaxonomies
                      ?.map((g: any) => g.desc)
                      .join(", "),
                  },
                ]}
                title="institution.cardTitle"
              />
            </Grid>
            <Grid item xs={12}>
              <ApiKeysCard />
            </Grid>
          </Grid>
        </Grid>
        {/* 
        // TODO should be implemented in next MVPs
        <Grid item xs={12} sm={12} md={5} lg={5} xl={4}>
          <AccessControl requiredPermissions={["ApiServiceWrite"]}>
            <CardShortcut
              text="service.shortcut.create.description"
              cta={{
                label: "service.shortcut.create.label",
                href: "/services/new-service",
                startIcon: <Add />
              }}
              icon={<Category />}
            />
          </AccessControl>
        </Grid> */}
        <Grid item lg={5} md={5} sm={12} xl={5} xs={12}>
          <AccessControl requiredPermissions={["ApiServiceWrite"]}>
            <MigrationManager />
          </AccessControl>
        </Grid>
      </Grid>
    </>
  );
}

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      // pass the translation props to the page component
      ...(await serverSideTranslations(locale)),
    },
  };
}

Home.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout>
      <PageLayout>{page}</PageLayout>
    </AppLayout>
  );
};
