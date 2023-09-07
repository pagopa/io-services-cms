import { PageHeader } from "@/components/headers";
import { AppLayout, PageLayout } from "@/layouts";
import { Box, Button } from "@mui/material";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import NextLink from "next/link";
import { ReactElement } from "react";

const pageTitleLocaleKey = "routes.services.title";
const pageDescriptionLocaleKey = "routes.services.description";

export default function Services() {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        title={pageTitleLocaleKey}
        description={pageDescriptionLocaleKey}
      />
      <Box paddingY={3}>
        <NextLink
          href={`/services/TEST12345678901234567890AB`}
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
