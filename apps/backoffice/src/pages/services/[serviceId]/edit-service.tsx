import { AppLayout, PageLayout } from "@/layouts";
import { Box, Button } from "@mui/material";
import Head from "next/head";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { ReactElement } from "react";

export default function EditService() {
  const router = useRouter();
  const serviceId = router.query.serviceId as string;

  return (
    <>
      <Head>
        <title>IO BackOffice | Modifica Servizio</title>
      </Head>
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
