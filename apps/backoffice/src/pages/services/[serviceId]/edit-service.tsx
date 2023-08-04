import { PageHtmlHeadTitle } from "@/components/utils/page-html-head-title";
import { AppLayout, PageLayout } from "@/layouts";
import { Box, Button } from "@mui/material";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { ReactElement } from "react";

export default function EditService() {
  const { t } = useTranslation();
  const router = useRouter();
  const serviceId = router.query.serviceId as string;

  return (
    <>
      <PageHtmlHeadTitle section="services" />
      <main>
        <Box>contenuto pagina {serviceId}</Box>
        <Box paddingY={3}>
          <NextLink
            href={`/services/${serviceId}`}
            passHref
            style={{ textDecoration: "none" }}
          >
            <Button size="medium" variant="contained">
              Torna al servizio
            </Button>
          </NextLink>
        </Box>
      </main>
    </>
  );
}

export async function getServerSideProps({ locale }: any) {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
}

EditService.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout hideSidenav>
      <PageLayout
        title="Modifica il servizio"
        subtitle="Segui i passaggi e compila i campi richiesti. Una volta modificato, potrai inviare il servizio in revisione e procedere poi alla pubblicazione su app IO."
        isFullWidth={false}
      >
        {page}
      </PageLayout>
    </AppLayout>
  );
};
