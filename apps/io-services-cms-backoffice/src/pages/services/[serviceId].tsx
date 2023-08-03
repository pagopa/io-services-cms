import { AppLayout, PageLayout } from "@/layouts";
import { Box, Button } from "@mui/material";
import Head from "next/head";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { ReactElement } from "react";

export default function ServiceDetails() {
  const router = useRouter();
  const serviceId = router.query.serviceId as string;

  return (
    <>
      <Head>
        <title>IO BackOffice | Dettagli Servizio</title>
      </Head>
      <main>
        <Box>contenuto pagina dettagli servizio {serviceId}</Box>
        <Box paddingY={3}>
          <NextLink
            href={`/services/${serviceId}/edit-service`}
            passHref
            style={{ textDecoration: "none" }}
          >
            <Button size="medium" variant="contained">
              Modifica il servizio
            </Button>
          </NextLink>
        </Box>
      </main>
    </>
  );
}

ServiceDetails.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout>
      <PageLayout title="Dettagli Servizio">{page}</PageLayout>
    </AppLayout>
  );
};
