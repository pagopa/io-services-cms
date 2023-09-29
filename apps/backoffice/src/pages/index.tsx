import { CardDetails } from "@/components/cards";
import { PageHeader } from "@/components/headers";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import useFetch from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
import { Grid } from "@mui/material";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ReactElement, useEffect } from "react";

const pageTitleLocaleKey = "routes.overview.title";
const pageDescriptionLocaleKey = "routes.overview.description";

export default function Home() {
  const { t } = useTranslation();
  const { data: mkData, fetchData: mkFetchData } = useFetch<SubscriptionKeys>();

  useEffect(() => {
    mkFetchData("getManageKeys", {}, SubscriptionKeys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PageHeader
        title={pageTitleLocaleKey}
        description={pageDescriptionLocaleKey}
      />
      <Grid container spacing={2}>
        <Grid item xs={12} sm={8} md={8} lg={6} xl={6}>
          <CardDetails
            title="routes.keys.manage.title"
            cta={{ label: "routes.keys.manage.shortcut", href: "/keys" }}
            rows={[
              {
                label: "keys.primary.title",
                value: mkData?.primary_key,
                kind: "apikey"
              },
              {
                label: "keys.secondary.title",
                value: mkData?.secondary_key,
                kind: "apikey"
              }
            ]}
          />
        </Grid>
      </Grid>
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

Home.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout>
      <PageLayout>{page}</PageLayout>
    </AppLayout>
  );
};
