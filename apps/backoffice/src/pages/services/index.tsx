import { PageHtmlHeadTitle } from "@/components/utils/page-html-head-title";
import { AppLayout, PageLayout } from "@/layouts";
import { Box, Button } from "@mui/material";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import NextLink from "next/link";
import { ReactElement } from "react";

export default function Services() {
  const { t } = useTranslation();

  return (
    <>
      <PageHtmlHeadTitle section="services" />
      <main>
        <Box>contenuto pagina lista servizi</Box>
        <Box paddingY={3}>
          <NextLink
            href={`/services/sample-service-id`}
            passHref
            style={{ textDecoration: "none" }}
          >
            <Button size="medium" variant="contained">
              Dettaglio servizio
            </Button>
          </NextLink>
        </Box>
        <Box>
          <NextLink
            href={`/services/new-service`}
            passHref
            style={{ textDecoration: "none" }}
          >
            <Button size="medium" variant="contained">
              Nuovo Servizio
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

Services.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout>
      <PageLayout title="Servizi">{page}</PageLayout>
    </AppLayout>
  );
};
