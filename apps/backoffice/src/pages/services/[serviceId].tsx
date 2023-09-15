import { PageHeader } from "@/components/headers";
import { AppLayout, PageLayout } from "@/layouts";
import { Box, Button } from "@mui/material";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { ReactElement } from "react";

export default function ServiceDetails() {
  const { t } = useTranslation();
  const router = useRouter();
  const serviceId = router.query.serviceId as string;

  return (
    <>
      <PageHeader title={serviceId} />
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

ServiceDetails.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout>
      <PageLayout>{page}</PageLayout>
    </AppLayout>
  );
};
