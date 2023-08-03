import { AppLayout, PageLayout } from "@/layouts";
import { Box, Button } from "@mui/material";
import Head from "next/head";
import NextLink from "next/link";
import { ReactElement } from "react";

export default function Services() {
  return (
    <>
      <Head>
        <title>IO BackOffice | Servizi</title>
      </Head>
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

Services.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout>
      <PageLayout title="Servizi">{page}</PageLayout>
    </AppLayout>
  );
};
