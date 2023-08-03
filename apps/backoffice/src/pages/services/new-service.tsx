import { PageHtmlHeadTitle } from "@/components/utils/page-html-head-title";
import { AppLayout, PageLayout } from "@/layouts";
import { Box, Button } from "@mui/material";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import NextLink from "next/link";
import { ReactElement } from "react";

export default function NewService() {
  const { t } = useTranslation();

  return (
    <>
      <PageHtmlHeadTitle section="services" />
      <main>
        <Box>contenuto pagina</Box>
        <Box paddingY={3}>
          <NextLink
            href={`/services`}
            passHref
            style={{ textDecoration: "none" }}
          >
            <Button size="medium" variant="contained">
              Esci
            </Button>
          </NextLink>
        </Box>
      </main>
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

NewService.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout hideSidenav>
      <PageLayout
        title="Crea un nuovo servizio"
        subtitle="Segui i passaggi e compila i campi richiesti. Una volta creato, potrai inviare il servizio in revisione e procedere poi alla pubblicazione su app IO."
        isFullWidth={false}
      >
        {page}
      </PageLayout>
    </AppLayout>
  );
};
