import { PageHeader } from "@/components/headers";
import { AppLayout, PageLayout } from "@/layouts";
import { Typography } from "@mui/material";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ReactElement } from "react";

const pageTitleLocaleKey = "routes.delegated-institutions.title";
const pageDescriptionLocaleKey = "routes.delegated-institutions.description";

export default function DelegatedInstitutions() {
  const { t } = useTranslation();
  const { data: session } = useSession();

  return (
    <>
      <PageHeader
        description={pageDescriptionLocaleKey}
        title={pageTitleLocaleKey}
      />
      <Typography color="text.secondary" fontStyle="italic" variant="body2">
        {t("placeholder page for aggregator institution ")}{" "}
        {session?.user?.institution.id}
      </Typography>
    </>
  );
}

export async function getStaticProps({ locale }: any) {
  // ! return a not found error if ff disabled
  if (process.env.NEXT_PUBLIC_EA_ENABLED !== "true") {
    return { notFound: true };
  }
  return {
    props: {
      // pass the translation props to the page component
      ...(await serverSideTranslations(locale)),
    },
  };
}

DelegatedInstitutions.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout>
      <PageLayout>{page}</PageLayout>
    </AppLayout>
  );
};
