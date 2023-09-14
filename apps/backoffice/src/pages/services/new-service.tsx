import { PageHeader } from "@/components/headers";
import { AppLayout, PageLayout } from "@/layouts";
import { Box, Button } from "@mui/material";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import NextLink from "next/link";
import { ReactElement } from "react";

const pageTitleLocaleKey = "routes.new-service.title";
const pageDescriptionLocaleKey = "routes.new-service.description";

export default function NewService() {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        title={pageTitleLocaleKey}
        description={pageDescriptionLocaleKey}
      />
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

NewService.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout hideSidenav>
      <PageLayout isFullWidth={false}>{page}</PageLayout>
    </AppLayout>
  );
};

NewService.requireAuth = true;
