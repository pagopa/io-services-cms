import { PageHeader } from "@/components/headers";
import useFetch from "@/hooks/use-fetch";
import { AppLayout, PageLayout } from "@/layouts";
import { Box, Typography } from "@mui/material";
import * as io from "io-ts";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ReactElement } from "react";

const pageTitleLocaleKey = "routes.overview.title";
const pageDescriptionLocaleKey = "routes.overview.description";

export default function Home() {
  const { t } = useTranslation();

  const testFetch = useFetch("info", {}, io.unknown);

  const { data: session } = useSession();

  console.log("session", session);

  return (
    <>
      <PageHeader
        title={pageTitleLocaleKey}
        description={pageDescriptionLocaleKey}
      />
      <Box>
        <Typography
          maxWidth={"calc(100vw - 500px);"}
          noWrap
          overflow={"hidden"}
        >
          {testFetch.loading
            ? "caricamento in corso"
            : testFetch.error
            ? JSON.stringify(testFetch.error)
            : JSON.stringify(testFetch.data)}
        </Typography>
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

Home.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout>
      <PageLayout>{page}</PageLayout>
    </AppLayout>
  );
};
