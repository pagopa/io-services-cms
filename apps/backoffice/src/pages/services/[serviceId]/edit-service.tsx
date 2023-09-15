import { PageHeader } from "@/components/headers";
import { AppLayout, PageLayout } from "@/layouts";
import { Box, Button } from "@mui/material";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { ReactElement } from "react";

const pageTitleLocaleKey = "routes.edit-service.title";
const pageDescriptionLocaleKey = "routes.edit-service.description";

export default function EditService() {
  const { t } = useTranslation();
  const router = useRouter();
  const serviceId = router.query.serviceId as string;

  return (
    <>
      <PageHeader
        title={pageTitleLocaleKey}
        description={pageDescriptionLocaleKey}
      />
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
    </>
  );
}

export async function getServerSideProps({ locale }: any) {
  return {
    props: {
      ...(await serverSideTranslations(locale))
    }
  };
}

EditService.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout hideSidenav>
      <PageLayout isFullWidth={false}>{page}</PageLayout>
    </AppLayout>
  );
};
