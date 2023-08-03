import { AppLayout, PageLayout } from "@/layouts";
import { Box, Button } from "@mui/material";
import Head from "next/head";
import NextLink from "next/link";
import { ReactElement } from "react";

export default function NewService() {
  return (
    <>
      <Head>
        <title>IO BackOffice | Nuovo Servizio</title>
      </Head>
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
